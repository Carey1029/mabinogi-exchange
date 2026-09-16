(function () {
  "use strict";

  var state = {
    data: null,
    mode: "item", // "item" | "resource"
  };

  var els = {
    modeTabs: document.querySelectorAll(".mode-tab"),
    select: document.getElementById("picker-select"),
    reminderNote: document.querySelector(".reminder-note"),
    resultArea: document.getElementById("result-area"),
    notesArea: document.getElementById("notes-area"),
    notesList: document.getElementById("notes-list"),
    updatedAt: document.getElementById("updated-at"),
  };

  var CATEGORY_CLASS = {
    "加工品": "cat-processed",
    "料理成品": "cat-cooking",
    "一般取得材料": "cat-material",
    "NPC物品": "cat-npc",
  };
  var DEFAULT_CLASS = "cat-other";

  var MAX_DEPTH = 8;

  function categoryClass(name) {
    var cat = (state.data.itemCategory || {})[name];
    return CATEGORY_CLASS[cat] || DEFAULT_CLASS;
  }

  function categoryIcon(name) {
    var cat = (state.data.itemCategory || {})[name];
    return window.MapleIcons.categoryIconName(cat);
  }

  fetch("data.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("data.json 讀取失敗 (" + res.status + ")");
      return res.json();
    })
    .then(function (json) {
      state.data = json;
      renderNotes();
      renderUpdatedAt();
      populateSelect();
      wireEvents();
      window.MapleIcons.apply(document);
    })
    .catch(function (err) {
      els.resultArea.innerHTML =
        '<div class="empty-state"><span class="empty-icon" data-icon="warning"></span>' +
        "<p>無法載入資料 (data.json)。<br>請確認 data.json 與 index.html 放在同一層目錄。<br>" +
        "<small>" + escapeHtml(err.message) + "</small></p></div>";
      window.MapleIcons.apply(els.resultArea);
      console.error(err);
    });

  function zhSort(a, b) {
    return a.localeCompare(b, "zh-Hant-TW");
  }

  function renderUpdatedAt() {
    var iso = state.data.generatedAt;
    var text = "資料版本：未知";
    if (iso) {
      try {
        var d = new Date(iso);
        text =
          "資料更新時間：" +
          d.getFullYear() + "/" + pad2(d.getMonth() + 1) + "/" + pad2(d.getDate()) +
          " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + "（依瀏覽器時區顯示）";
      } catch (e) {}
    }
    els.updatedAt.textContent = text;
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function renderNotes() {
    var notes = state.data.notes || [];
    if (!notes.length) return;
    els.notesArea.hidden = false;
    els.notesList.innerHTML = notes
      .map(function (n) {
        var parts = [];
        if (n.region) parts.push(n.region);
        if (n.npc) parts.push(n.npc);
        return "<li>" + escapeHtml(parts.join(" · ")) + "</li>";
      })
      .join("");
  }

  /* ---------------- Select population ---------------- */

  function categoryOrder() {
    return state.data.categoryOrder || ["加工品", "料理成品", "一般取得材料", "NPC物品", "未分類"];
  }

  function namesForMode() {
    var items = state.data.items || {};
    if (state.mode === "item") {
      return Object.keys(items);
    }
    // resource mode: every name that ever appears as a "resource" in any recipe
    var set = {};
    Object.keys(items).forEach(function (itemName) {
      items[itemName].forEach(function (recipe) {
        if (recipe.resource && recipe.resource.name) set[recipe.resource.name] = true;
      });
    });
    return Object.keys(set);
  }

  function populateSelect() {
    var names = namesForMode();
    var byCategory = {};
    names.forEach(function (name) {
      var cat = (state.data.itemCategory || {})[name] || "未分類";
      byCategory[cat] = byCategory[cat] || [];
      byCategory[cat].push(name);
    });

    var html = '<option value="">— 請選擇 —</option>';
    categoryOrder().forEach(function (cat) {
      var list = byCategory[cat];
      if (!list || !list.length) return;
      list.sort(zhSort);
      html += '<optgroup label="【' + escapeHtml(cat) + '】">';
      list.forEach(function (name) {
        html += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + "</option>";
      });
      html += "</optgroup>";
    });

    els.select.innerHTML = html;

    if (state.mode === "item") {
      setReminderText("目前僅列出有兌換價值之物品。");
    } else {
      setReminderText("以下列出目前資料中所有可作為兌換素材的資源。");
    }
  }

  function setReminderText(text) {
    var iconSpan = els.reminderNote.querySelector(".reminder-icon");
    els.reminderNote.innerHTML = "";
    els.reminderNote.appendChild(iconSpan);
    els.reminderNote.appendChild(document.createTextNode(text));
  }

  function wireEvents() {
    els.modeTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        els.modeTabs.forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        state.mode = tab.getAttribute("data-mode");
        populateSelect();
        window.MapleIcons.apply(document);
        showEmptyState();
      });
    });

    els.select.addEventListener("change", function () {
      var name = els.select.value;
      if (!name) {
        showEmptyState();
        return;
      }
      if (state.mode === "item") {
        renderItemResult(name);
      } else {
        renderResourceResult(name);
      }
      window.MapleIcons.apply(els.resultArea);
    });
  }

  function showEmptyState() {
    els.resultArea.innerHTML =
      '<div class="empty-state"><span class="empty-icon" data-icon="book"></span>' +
      "<p>選擇上方頁籤，並從下拉選單挑一個名稱，<br>手冊會翻開對應的兌換路線。</p></div>";
    window.MapleIcons.apply(els.resultArea);
  }

  function jumpTo(name) {
    if (state.data.items[name]) {
      setMode("item");
    } else {
      setMode("resource");
    }
    populateSelect();
    els.select.value = name;
    if (state.mode === "item") {
      renderItemResult(name);
    } else {
      renderResourceResult(name);
    }
    window.MapleIcons.apply(els.resultArea);
    window.MapleIcons.apply(document);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setMode(mode) {
    state.mode = mode;
    els.modeTabs.forEach(function (t) {
      var active = t.getAttribute("data-mode") === mode;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  /* ---------------- Shared node rendering ---------------- */

  function recipeNodeHtml(name, recipe) {
    var cls = categoryClass(name);
    var iconName = categoryIcon(name);
    var region = recipe.region ? escapeHtml(recipe.region) : "未知地區";
    var npc = recipe.npc ? escapeHtml(recipe.npc) : "未知 NPC";
    var star = recipe.recommended
      ? '<span class="flow-star" data-icon="star" title="推薦兌換"></span>'
      : "";
    var qtyLine = recipe.resultQty
      ? '<span class="result-qty">每次兌換可得 × ' + recipe.resultQty + "</span>"
      : "";

    return (
      '<div class="flow-node ' + cls + '">' +
      '<div class="flow-node-head">' +
      '<span class="flow-node-icon" data-icon="' + iconName + '"></span>' +
      '<span class="flow-node-name">' + escapeHtml(name) + "</span>" +
      star +
      "</div>" +
      '<div class="flow-node-meta">' +
      '<span class="pin-icon" data-icon="pin"></span>' +
      '<span class="npc-tag">' + npc + "</span>" +
      '<span class="region-tag">' + region + "</span>" +
      qtyLine +
      "</div>" +
      "</div>"
    );
  }

  function arrowHtml(label) {
    return (
      '<div class="flow-arrow">' +
      '<span class="flow-arrow-icon" data-icon="arrowDown"></span>' +
      (label ? '<span class="flow-arrow-label">' + escapeHtml(label) + "</span>" : "") +
      "</div>"
    );
  }

  function needLineHtml(recipe) {
    if (!recipe.resource) return "（無需材料）";
    var isCraftable = !!state.data.items[recipe.resource.name];
    var cls = categoryClass(recipe.resource.name);
    var jumpAttr = isCraftable ? ' data-jump="' + escapeHtml(recipe.resource.name) + '"' : "";
    var jumpCls = isCraftable ? " is-jumpable" : "";
    return (
      '<div class="need-line">需要：' +
      '<span class="res-name ' + cls + jumpCls + '"' + jumpAttr + ">" +
      escapeHtml(recipe.resource.name) +
      "</span>" +
      ' <span class="res-qty">× ' + recipe.resource.qty + "</span>" +
      "</div>"
    );
  }

  /* ---------------- Upstream (how to obtain) ---------------- */

  function buildUpstreamHtml(itemName, visitedSet, depth) {
    var recipes = (state.data.items || {})[itemName];
    if (!recipes || depth > MAX_DEPTH) return "";

    var visited = new Set(visitedSet);
    visited.add(itemName);

    var html = '<div class="flow-branch">';

    recipes.forEach(function (recipe, idx) {
      html += recipeNodeHtml(itemName, recipe) + needLineHtml(recipe);

      var subName = recipe.resource ? recipe.resource.name : null;
      if (subName && state.data.items[subName] && !visited.has(subName)) {
        html += arrowHtml("需先兌換");
        html += buildUpstreamHtml(subName, visited, depth + 1);
      }

      if (idx < recipes.length - 1) {
        html += '<div class="flow-or">或</div>';
      }
    });

    html += "</div>";
    return html;
  }

  /** 嘗試找出「唯一一條路徑」的完整上游鏈，若中途出現任何分支（多種兌換方式）則回傳 null。 */
  function findLinearUpstreamPath(itemName, visited) {
    var recipes = (state.data.items || {})[itemName];
    if (!recipes || recipes.length !== 1) return null;
    var recipe = recipes[0];
    var step = { item: itemName, region: recipe.region, npc: recipe.npc, resource: recipe.resource };
    var subName = recipe.resource ? recipe.resource.name : null;
    if (subName && state.data.items[subName] && !visited.has(subName)) {
      var rest = findLinearUpstreamPath(subName, new Set(visited).add(itemName));
      if (rest === null) return null; // 下游有分支，放棄生成句子
      return [step].concat(rest);
    }
    return [step];
  }

  function renderItemResult(itemName) {
    var items = state.data.items || {};
    var recipes = items[itemName];

    if (!recipes) {
      els.resultArea.innerHTML =
        '<div class="empty-state"><span class="empty-icon" data-icon="question"></span><p>找不到「' +
        escapeHtml(itemName) +
        '」的兌換資料。</p></div>';
      return;
    }

    var html = "";
    html +=
      '<div class="target-plaque"><span class="plaque-icon" data-icon="' + categoryIcon(itemName) + '"></span><div>' +
      '<div class="plaque-title">' + escapeHtml(itemName) + "</div>" +
      '<div class="plaque-sub">' +
      (recipes.length > 1 ? "共 " + recipes.length + " 種兌換方式" : "兌換方式") +
      "</div></div></div>";

    var linearPath = findLinearUpstreamPath(itemName, new Set());
    if (linearPath && linearPath.length > 1) {
      html += buildUpstreamSentence(linearPath);
    }

    html += '<div class="section-label"><span class="sec-icon" data-icon="chest"></span>完整兌換流程</div>';
    html += '<div class="flow">' + buildUpstreamHtml(itemName, new Set(), 0) + "</div>";

    els.resultArea.innerHTML = html;
  }

  function buildUpstreamSentence(path) {
    // path: [{item, region, npc, resource}, ...] 由目標物品往上游追溯
    var parts = [];
    for (var i = 0; i < path.length; i++) {
      var step = path[i];
      var where = (step.region || "未知地區") + "的" + (step.npc || "未知NPC");
      if (i === 0) {
        parts.push(
          "向<span class=\"s-npc\">" + escapeHtml(where) + "</span>兌換「<span class=\"s-item\">" +
          escapeHtml(step.item) + "</span>」需要「<span class=\"s-item\">" +
          escapeHtml(step.resource.name) + "</span>」× " + step.resource.qty
        );
      } else {
        parts.push(
          "取得「<span class=\"s-item\">" + escapeHtml(path[i - 1].resource.name) +
          "</span>」後，需再向<span class=\"s-npc\">" + escapeHtml(where) + "</span>兌換「<span class=\"s-item\">" +
          escapeHtml(step.item) + "</span>」，需要「<span class=\"s-item\">" + escapeHtml(step.resource.name) +
          "</span>」× " + step.resource.qty
        );
      }
    }
    return '<div class="summary-quote">' + parts.join("；") + "。</div>";
  }

  /* ---------------- Downstream (what can this be turned into) ---------------- */

  function findDownstreamUsers(name) {
    var items = state.data.items || {};
    var users = [];
    Object.keys(items).forEach(function (itemName) {
      items[itemName].forEach(function (recipe) {
        if (recipe.resource && recipe.resource.name === name) {
          users.push({ itemName: itemName, recipe: recipe });
        }
      });
    });
    return users;
  }

  function buildDownstreamHtml(name, visitedSet, depth) {
    var users = findDownstreamUsers(name);
    if (!users.length || depth > MAX_DEPTH) return "";

    var visited = new Set(visitedSet);
    visited.add(name);

    var html = '<div class="flow-branch">';
    users.forEach(function (u, idx) {
      html += arrowHtml("需要 × " + (u.recipe.resource.qty || 1));
      html += recipeNodeHtml(u.itemName, u.recipe);

      if (!visited.has(u.itemName)) {
        html += buildDownstreamHtml(u.itemName, visited, depth + 1);
      }

      if (idx < users.length - 1) {
        html += '<div class="flow-or" style="color:var(--azure-dark)">此資源也同時用於下一種兌換</div>';
      }
    });
    html += "</div>";
    return html;
  }

  /** 找出「唯一一條路徑」的完整下游鏈（用來生成敘述句），若有分支則回傳 null。 */
  function findLinearDownstreamPath(name, visited) {
    var users = findDownstreamUsers(name);
    if (users.length !== 1) return users.length === 0 ? [] : null;
    var u = users[0];
    if (visited.has(u.itemName)) return [];
    var step = { fromName: name, item: u.itemName, region: u.recipe.region, npc: u.recipe.npc, qty: u.recipe.resource.qty };
    var rest = findLinearDownstreamPath(u.itemName, new Set(visited).add(name));
    if (rest === null) return null;
    return [step].concat(rest);
  }

  function buildDownstreamSentence(startName, path) {
    if (!path || !path.length) return "";
    var parts = [];
    for (var i = 0; i < path.length; i++) {
      var step = path[i];
      var where = (step.region || "未知地區") + "的" + (step.npc || "未知NPC");
      if (i === 0) {
        parts.push(
          "向<span class=\"s-npc\">" + escapeHtml(where) + "</span>兌換「<span class=\"s-item\">" +
          escapeHtml(step.item) + "</span>」需用「<span class=\"s-item\">" + escapeHtml(startName) + "</span>」"
        );
      } else {
        parts.push(
          "取得「<span class=\"s-item\">" + escapeHtml(path[i - 1].item) +
          "</span>」後，需再向<span class=\"s-npc\">" + escapeHtml(where) + "</span>兌換「<span class=\"s-item\">" +
          escapeHtml(step.item) + "</span>」"
        );
      }
    }
    return '<div class="summary-quote">' + parts.join("；") + "。</div>";
  }

  function renderResourceResult(resourceName) {
    var items = state.data.items || {};
    var html = "";

    html += '<div class="info-banner"><span class="reminder-icon" data-icon="info"></span>數量為單日可兌換最大值。</div>';

    html +=
      '<div class="target-plaque"><span class="plaque-icon" data-icon="' + categoryIcon(resourceName) + '"></span><div>' +
      '<div class="plaque-title">' + escapeHtml(resourceName) + "</div>" +
      '<div class="plaque-sub">資源總覽</div></div></div>';

    if (items[resourceName]) {
      html += '<div class="section-label"><span class="sec-icon" data-icon="chest"></span>如何取得「' + escapeHtml(resourceName) + '」</div>';
      html += '<div class="flow">' + buildUpstreamHtml(resourceName, new Set(), 0) + "</div>";
    }

    var downstreamPath = findLinearDownstreamPath(resourceName, new Set());
    if (downstreamPath && downstreamPath.length > 1) {
      html += buildDownstreamSentence(resourceName, downstreamPath);
    }

    html += '<div class="section-label"><span class="sec-icon" data-icon="branch"></span>「' + escapeHtml(resourceName) + '」可以進一步兌換成</div>';
    var downstreamHtml = buildDownstreamHtml(resourceName, new Set(), 0);
    if (downstreamHtml) {
      html += '<div class="flow">' + downstreamHtml + "</div>";
    } else {
      html += '<p style="color:var(--ink-soft);font-size:13.5px;">目前資料中沒有找到使用此資源的兌換項目。</p>';
    }

    els.resultArea.innerHTML = html;

    Array.prototype.forEach.call(els.resultArea.querySelectorAll("[data-jump]"), function (el) {
      el.addEventListener("click", function () {
        jumpTo(el.getAttribute("data-jump"));
      });
    });
  }

  // item-mode click delegation for jumpable resource names inside upstream chains
  els.resultArea.addEventListener("click", function (e) {
    var el = e.target.closest("[data-jump]");
    if (el) jumpTo(el.getAttribute("data-jump"));
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
