(function () {
  "use strict";

  var state = {
    data: null,
    mode: "item",           // "item" | "resource"
    itemNames: [],
    resourceNames: [],
    activeSuggestionIndex: -1,
    currentSuggestions: [],
  };

  var els = {
    modeTabs: document.querySelectorAll(".mode-tab"),
    searchInput: document.getElementById("search-input"),
    suggestions: document.getElementById("suggestions"),
    resultArea: document.getElementById("result-area"),
    notesArea: document.getElementById("notes-area"),
    notesList: document.getElementById("notes-list"),
    updatedAt: document.getElementById("updated-at"),
  };

  var MAX_DEPTH = 6;

  fetch("data.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("data.json 讀取失敗 (" + res.status + ")");
      return res.json();
    })
    .then(function (json) {
      state.data = json;
      buildIndexes();
      renderNotes();
      renderUpdatedAt();
      wireEvents();
    })
    .catch(function (err) {
      els.resultArea.innerHTML =
        '<div class="empty-state"><div class="empty-icon">⚠️</div>' +
        "<p>無法載入資料 (data.json)。<br>請確認 data.json 與 index.html 放在同一層目錄。<br>" +
        "<small>" + escapeHtml(err.message) + "</small></p></div>";
      console.error(err);
    });

  function buildIndexes() {
    var items = state.data.items || {};
    state.itemNames = Object.keys(items).sort(zhSort);

    var resourceSet = {};
    Object.keys(items).forEach(function (itemName) {
      items[itemName].forEach(function (recipe) {
        if (recipe.resource && recipe.resource.name) {
          resourceSet[recipe.resource.name] = true;
        }
      });
    });
    state.resourceNames = Object.keys(resourceSet).sort(zhSort);
  }

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
        var where = parts.join(" · ");
        return "<li>" + escapeHtml(where) + "：" + escapeHtml(n.shop || "") + "</li>";
      })
      .join("");
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
        els.searchInput.value = "";
        els.searchInput.placeholder =
          state.mode === "item"
            ? "輸入想兌換的物品名稱，例如「皮革」…"
            : "輸入手上持有的資源名稱，例如「原木」…";
        hideSuggestions();
        showEmptyState();
      });
    });

    els.searchInput.addEventListener("input", function () {
      var q = els.searchInput.value.trim();
      if (!q) {
        hideSuggestions();
        showEmptyState();
        return;
      }
      showSuggestions(q);
    });

    els.searchInput.addEventListener("keydown", function (e) {
      if (!state.currentSuggestions.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSuggestionActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSuggestionActive(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        var idx = state.activeSuggestionIndex >= 0 ? state.activeSuggestionIndex : 0;
        var pick = state.currentSuggestions[idx];
        if (pick) selectName(pick);
      } else if (e.key === "Escape") {
        hideSuggestions();
      }
    });

    document.addEventListener("click", function (e) {
      if (!els.suggestions.contains(e.target) && e.target !== els.searchInput) {
        hideSuggestions();
      }
    });
  }

  function currentNameList() {
    return state.mode === "item" ? state.itemNames : state.resourceNames;
  }

  function showSuggestions(query) {
    var list = currentNameList().filter(function (name) {
      return name.indexOf(query) !== -1;
    });
    state.currentSuggestions = list.slice(0, 30);
    state.activeSuggestionIndex = -1;

    if (!state.currentSuggestions.length) {
      els.suggestions.innerHTML = '<div class="suggestion-item">找不到符合的名稱</div>';
      els.suggestions.hidden = false;
      return;
    }

    els.suggestions.innerHTML = state.currentSuggestions
      .map(function (name) {
        var tag = "";
        if (state.mode === "resource" && state.data.items[name]) {
          tag = '<span class="tag">亦可兌換取得</span>';
        }
        return (
          '<div class="suggestion-item" data-name="' +
          escapeHtml(name) +
          '">' +
          escapeHtml(name) +
          tag +
          "</div>"
        );
      })
      .join("");
    els.suggestions.hidden = false;

    Array.prototype.forEach.call(els.suggestions.querySelectorAll(".suggestion-item[data-name]"), function (el) {
      el.addEventListener("click", function () {
        selectName(el.getAttribute("data-name"));
      });
    });
  }

  function moveSuggestionActive(delta) {
    var nodes = els.suggestions.querySelectorAll(".suggestion-item[data-name]");
    if (!nodes.length) return;
    state.activeSuggestionIndex =
      (state.activeSuggestionIndex + delta + nodes.length) % nodes.length;
    nodes.forEach(function (n, i) {
      n.classList.toggle("is-active", i === state.activeSuggestionIndex);
    });
  }

  function hideSuggestions() {
    els.suggestions.hidden = true;
    els.suggestions.innerHTML = "";
    state.currentSuggestions = [];
    state.activeSuggestionIndex = -1;
  }

  function selectName(name) {
    els.searchInput.value = name;
    hideSuggestions();
    if (state.mode === "item") {
      renderItemResult(name);
    } else {
      renderResourceResult(name);
    }
  }

  function showEmptyState() {
    els.resultArea.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📜</div>' +
      "<p>選擇上方頁籤，並輸入或挑選一個名稱，<br>手冊會翻開對應的兌換路線。</p></div>";
  }

  // Jump helper used by clickable resource names inside chains
  function jumpTo(name) {
    if (state.data.items[name]) {
      setMode("item");
      els.searchInput.value = name;
      renderItemResult(name);
    } else {
      setMode("resource");
      els.searchInput.value = name;
      renderResourceResult(name);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.__maple_jumpTo = jumpTo;

  function setMode(mode) {
    state.mode = mode;
    els.modeTabs.forEach(function (t) {
      var active = t.getAttribute("data-mode") === mode;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  /* ---------------- Item mode ---------------- */

  function renderItemResult(itemName) {
    var items = state.data.items || {};
    var recipes = items[itemName];

    if (!recipes) {
      els.resultArea.innerHTML =
        '<div class="empty-state"><div class="empty-icon">❓</div><p>找不到「' +
        escapeHtml(itemName) +
        '」的兌換資料。</p></div>';
      return;
    }

    var html = "";
    html +=
      '<div class="target-plaque"><span class="plaque-icon">🎁</span><div>' +
      '<div class="plaque-title">' + escapeHtml(itemName) + "</div>" +
      '<div class="plaque-sub">' +
      (recipes.length > 1 ? "共 " + recipes.length + " 種兌換方式" : "兌換方式") +
      "</div></div></div>";

    html += buildChainHtml(itemName, new Set(), 0);

    els.resultArea.innerHTML = html;
    bindResourceClicks();
  }

  function buildChainHtml(itemName, visitedSet, depth) {
    var recipes = (state.data.items || {})[itemName];
    if (!recipes || depth > MAX_DEPTH) return "";

    var visited = new Set(visitedSet);
    visited.add(itemName);

    var html = '<div class="chain">';

    recipes.forEach(function (recipe, idx) {
      html += renderNodeHtml(itemName, recipe);

      var subName = recipe.resource ? recipe.resource.name : null;
      if (subName && state.data.items[subName] && !visited.has(subName)) {
        html +=
          '<div class="sub-hint">▼「' + escapeHtml(subName) + '」本身也可透過兌換取得：</div>';
        html += buildChainHtml(subName, visited, depth + 1);
      }

      if (idx < recipes.length - 1) {
        html += '<div class="divider-or">— 或 —</div>';
      }
    });

    html += "</div>";
    return html;
  }

  function renderNodeHtml(itemName, recipe) {
    var region = recipe.region ? escapeHtml(recipe.region) : "未知地區";
    var npc = recipe.npc ? escapeHtml(recipe.npc) : "未知 NPC";
    var shopTag = recipe.shop
      ? '<span class="node-shop">' + escapeHtml(recipe.shop) + "</span>"
      : "";

    var resHtml = "";
    if (recipe.resource) {
      var isCraftable = !!state.data.items[recipe.resource.name];
      resHtml =
        (isCraftable
          ? '<span class="node-resource-name" data-jump="' +
            escapeHtml(recipe.resource.name) +
            '">' +
            escapeHtml(recipe.resource.name) +
            "</span>"
          : "「" + escapeHtml(recipe.resource.name) + "」") +
        ' <span class="node-qty">× ' +
        recipe.resource.qty +
        "</span>";
    } else {
      resHtml = "（無需材料，或詳見特殊商店備註）";
    }

    return (
      '<div class="node">' +
      '<div class="node-head">' +
      '<span class="node-npc">' + npc + "</span>" +
      '<span class="node-region">' + region + "</span>" +
      shopTag +
      "</div>" +
      '<div class="node-body">向 <b>' + npc + "</b> 兌換「" + escapeHtml(itemName) + "」需要：" +
      resHtml +
      "</div>" +
      "</div>"
    );
  }

  function bindResourceClicks() {
    Array.prototype.forEach.call(els.resultArea.querySelectorAll("[data-jump]"), function (el) {
      el.addEventListener("click", function () {
        jumpTo(el.getAttribute("data-jump"));
      });
    });
  }

  /* ---------------- Resource mode ---------------- */

  function renderResourceResult(resourceName) {
    var items = state.data.items || {};
    var html = "";

    html +=
      '<div class="target-plaque"><span class="plaque-icon">🌾</span><div>' +
      '<div class="plaque-title">' + escapeHtml(resourceName) + "</div>" +
      '<div class="plaque-sub">資源總覽</div></div></div>';

    // 1. If this resource is itself an obtainable item, show its own recipe chain
    if (items[resourceName]) {
      html += '<div class="section-label">如何取得「' + escapeHtml(resourceName) + '」</div>';
      html += buildChainHtml(resourceName, new Set(), 0);
    }

    // 2. What can be exchanged using this resource
    var usedBy = [];
    Object.keys(items).forEach(function (itemName) {
      items[itemName].forEach(function (recipe) {
        if (recipe.resource && recipe.resource.name === resourceName) {
          usedBy.push({ itemName: itemName, recipe: recipe });
        }
      });
    });

    html += '<div class="section-label">使用「' + escapeHtml(resourceName) + '」可以兌換的物品</div>';

    if (!usedBy.length) {
      html += '<p class="sub-hint">目前資料中沒有找到使用此資源兌換的物品。</p>';
    } else {
      html += '<ul class="used-by-list">';
      usedBy.forEach(function (entry) {
        var r = entry.recipe;
        var shopTag = r.shop
          ? '<span class="node-shop">' + escapeHtml(r.shop) + "</span>"
          : "";
        html +=
          "<li>" +
          '<div class="node-head">' +
          '<span class="node-npc" data-jump="' + escapeHtml(entry.itemName) + '" style="cursor:pointer;text-decoration:underline dashed;">' +
          escapeHtml(entry.itemName) +
          "</span>" +
          '<span class="node-region">' + escapeHtml(r.region || "未知地區") + "</span>" +
          shopTag +
          "</div>" +
          '<div class="node-body">向 <b>' + escapeHtml(r.npc || "未知 NPC") + "</b> 兌換，需要「" +
          escapeHtml(resourceName) + '」× ' + r.resource.qty +
          "</div>" +
          "</li>";
      });
      html += "</ul>";
    }

    els.resultArea.innerHTML = html;
    bindResourceClicks();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
