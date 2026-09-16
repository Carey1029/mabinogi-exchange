/* 可愛電玩風格 SVG 圖示庫（原創繪製，非遊戲內素材） */
(function () {
  "use strict";

  var STROKE = "#3a3550";

  var ICONS = {
    chest: '\
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">\
<rect x="6" y="20" width="36" height="20" rx="5" fill="#F4B860" stroke="' + STROKE + '" stroke-width="2.5"/>\
<rect x="6" y="20" width="36" height="9" rx="4" fill="#8A5A34" stroke="' + STROKE + '" stroke-width="2.5"/>\
<path d="M8 20 C8 11 14 7 24 7 C34 7 40 11 40 20" fill="#F4B860" stroke="' + STROKE + '" stroke-width="2.5"/>\
<circle cx="24" cy="29" r="4.2" fill="#FFE29B" stroke="' + STROKE + '" stroke-width="2.2"/>\
<ellipse cx="14" cy="24" rx="3" ry="1.6" fill="#fff" opacity=".7"/>\
</svg>',

    bag: '\
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">\
<path d="M14 20c0-7 4.5-12 10-12s10 5 10 12" stroke="' + STROKE + '" stroke-width="2.5" fill="none"/>\
<rect x="9" y="18" width="30" height="23" rx="7" fill="#8FCB7A" stroke="' + STROKE + '" stroke-width="2.5"/>\
<rect x="18" y="24" width="12" height="8" rx="3" fill="#F6E7B4" stroke="' + STROKE + '" stroke-width="2"/>\
<ellipse cx="17" cy="24" rx="3" ry="1.6" fill="#fff" opacity=".6"/>\
</svg>',

    info: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="12" fill="#FFDD73" stroke="' + STROKE + '" stroke-width="2.2"/>\
<circle cx="16" cy="10.5" r="1.9" fill="' + STROKE + '"/>\
<rect x="14.3" y="14" width="3.4" height="9" rx="1.5" fill="' + STROKE + '"/>\
</svg>',

    book: '\
<svg viewBox="0 0 56 44" fill="none" xmlns="http://www.w3.org/2000/svg">\
<path d="M28 10c-5-4-13-5-22-3v27c9-2 17-1 22 3 5-4 13-5 22-3V7c-9-2-17-1-22 3z" fill="#FFF6E0" stroke="' + STROKE + '" stroke-width="2.5" stroke-linejoin="round"/>\
<path d="M28 10v27" stroke="' + STROKE + '" stroke-width="2" opacity=".5"/>\
<path d="M10 13c4-1 8-1 12 1M10 20c4-1 8-1 12 1M32 14c4-2 8-2 12-1M32 21c4-2 8-2 12-1" stroke="#E5A45C" stroke-width="2" stroke-linecap="round"/>\
</svg>',

    star: '\
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
<path d="M12 2.5l2.7 6 6.6.6-5 4.4 1.5 6.4L12 16.8l-5.8 3.1 1.5-6.4-5-4.4 6.6-.6z" fill="#FFCC4D" stroke="' + STROKE + '" stroke-width="1.8" stroke-linejoin="round"/>\
</svg>',

    arrowDown: '\
<svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">\
<path d="M16 3v24" stroke="#B9AAE0" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 7"/>\
<path d="M6 24l10 12 10-12" fill="#C9B6F0" stroke="' + STROKE + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>\
</svg>',

    branch: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="13" fill="#FFE7EF" stroke="' + STROKE + '" stroke-width="2"/>\
<path d="M16 9v6M16 15l-5 5M16 15l5 5" stroke="#E8749A" stroke-width="2.4" stroke-linecap="round"/>\
</svg>',

    /* 分類圖示 */
    cat_processed: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="14" fill="#FFE3B0"/>\
<circle cx="16" cy="16" r="7" fill="none" stroke="' + STROKE + '" stroke-width="2"/>\
<path d="M16 9v14M9 16h14" stroke="' + STROKE + '" stroke-width="1.6" opacity=".55"/>\
<circle cx="16" cy="16" r="2.2" fill="#E8934C"/>\
</svg>',

    cat_cooking: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="14" fill="#FFD2DA"/>\
<path d="M9 17h14l-1.4 6.5a3 3 0 01-3 2.5h-5.2a3 3 0 01-3-2.5z" fill="#fff" stroke="' + STROKE + '" stroke-width="2"/>\
<path d="M8 17h16" stroke="' + STROKE + '" stroke-width="2.2" stroke-linecap="round"/>\
<path d="M13 9c-1 1.3-1 2.2 0 3M17 8.5c-1 1.3-1 2.2 0 3" stroke="#E8749A" stroke-width="1.8" stroke-linecap="round"/>\
</svg>',

    cat_material: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="14" fill="#D9F0CE"/>\
<path d="M11 21l-2-8 7-4 7 4-2 8z" fill="#9AD17F" stroke="' + STROKE + '" stroke-width="2" stroke-linejoin="round"/>\
<path d="M9 13l7 4 7-4" stroke="' + STROKE + '" stroke-width="1.6" opacity=".6" fill="none"/>\
</svg>',

    cat_npc: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="14" fill="#E4D6FA"/>\
<rect x="9" y="14" width="14" height="10" rx="2.5" fill="#C6A6F2" stroke="' + STROKE + '" stroke-width="2"/>\
<rect x="9" y="14" width="14" height="4" fill="#B694ED"/>\
<path d="M16 8c-2 0-3.4 1.4-3.4 3.2 0 1.3.8 2 1.4 2.8h4c.6-.8 1.4-1.5 1.4-2.8C19.4 9.4 18 8 16 8z" fill="#F2E1FF" stroke="' + STROKE + '" stroke-width="1.6"/>\
</svg>',

    cat_other: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="14" fill="#E4E4EE"/>\
<circle cx="16" cy="16" r="4.5" fill="#B7B7CC"/>\
</svg>',

    pin: '\
<svg viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">\
<path d="M12 2c-5 0-9 3.6-9 9 0 6.5 9 16 9 16s9-9.5 9-16c0-5.4-4-9-9-9z" fill="#7FD1E0" stroke="' + STROKE + '" stroke-width="2" stroke-linejoin="round"/>\
<circle cx="12" cy="11" r="3.6" fill="#fff" stroke="' + STROKE + '" stroke-width="1.6"/>\
</svg>',

    question: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<circle cx="16" cy="16" r="13" fill="#CDE7FA" stroke="' + STROKE + '" stroke-width="2.2"/>\
<path d="M12.5 12.5c0-2.2 1.7-3.8 3.8-3.8s3.6 1.4 3.6 3.3c0 2.6-3.4 2.6-3.4 5.4" stroke="' + STROKE + '" stroke-width="2.2" stroke-linecap="round" fill="none"/>\
<circle cx="16.3" cy="22" r="1.7" fill="' + STROKE + '"/>\
</svg>',

    warning: '\
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\
<path d="M16 4l14 24H2z" fill="#FFD27A" stroke="' + STROKE + '" stroke-width="2.4" stroke-linejoin="round"/>\
<rect x="14.6" y="13" width="2.8" height="8" rx="1.3" fill="' + STROKE + '"/>\
<circle cx="16" cy="24" r="1.7" fill="' + STROKE + '"/>\
</svg>',
  };

  var CATEGORY_ICON = {
    "加工品": "cat_processed",
    "料理成品": "cat_cooking",
    "一般取得材料": "cat_material",
    "NPC物品": "cat_npc",
  };

  function iconMarkup(name) {
    return ICONS[name] || "";
  }

  function categoryIconName(category) {
    return CATEGORY_ICON[category] || "cat_other";
  }

  function applyIcons(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-icon]"), function (el) {
      var name = el.getAttribute("data-icon");
      if (!el.dataset.iconApplied) {
        el.innerHTML = iconMarkup(name);
        el.dataset.iconApplied = "1";
      }
    });
  }

  window.MapleIcons = {
    markup: iconMarkup,
    categoryIconName: categoryIconName,
    apply: applyIcons,
  };
})();
