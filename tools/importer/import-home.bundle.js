/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-video.js
  function parse(element, { document: document2 }) {
    const heading = element.querySelector(".homepage-a-hero_title h1, h1, h2");
    const poster = [...element.querySelectorAll(".homepage-a-hero_image img, img")].find((img) => !img.closest("button") && !(img.getAttribute("src") || "").startsWith("data:"));
    const videos = [...element.querySelectorAll("video")];
    const videoSrc = (v) => {
      var _a;
      return v ? v.getAttribute("src") || ((_a = v.querySelector("source")) == null ? void 0 : _a.getAttribute("src")) || "" : "";
    };
    const mobileVideo = videos.find((v) => v.classList.contains("homepage-a-hero_video--mobile"));
    const desktopVideo = videos.find((v) => v !== mobileVideo) || null;
    const desktopSrc = videoSrc(desktopVideo);
    const mobileSrc = videoSrc(mobileVideo);
    const ctas = [...element.querySelectorAll(".homepage-a-hero_content a[href], .homepage-a-hero_text a[href]")].filter((a, i, arr) => arr.indexOf(a) === i && !a.closest("h1, h2"));
    const paragraphs = [...element.querySelectorAll(".homepage-a-hero_content p")].filter((p) => p.textContent.trim());
    if (!heading && !poster && !desktopSrc) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const makeLink = (href) => {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = href;
      a.textContent = href;
      p.append(a);
      return p;
    };
    const cells = [];
    const mediaCell = [];
    if (poster) mediaCell.push(poster);
    if (desktopSrc) mediaCell.push(makeLink(desktopSrc));
    if (mobileSrc && mobileSrc !== desktopSrc) mediaCell.push(makeLink(mobileSrc));
    if (mediaCell.length) cells.push([mediaCell]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      contentCell.push(p);
    });
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-quick-actions.js
  var TRACK_URL = "https://www.fedex.com/fedextrack/";
  function spriteIdFromIcon(item) {
    const use = item.querySelector("svg use");
    if (use) {
      const href = use.getAttribute("xlink:href") || use.getAttribute("href") || "";
      if (href) return href.replace(/^.*#/, "");
    }
    const img = item.querySelector("fdx-icon img, img");
    const src = img ? img.getAttribute("src") || "" : "";
    if (src.startsWith("data:image/svg+xml")) {
      let svg = "";
      try {
        const [, payload = ""] = src.split(",");
        svg = src.includes(";base64,") ? atob(payload) : decodeURIComponent(payload);
      } catch (e) {
        svg = "";
      }
      const m = svg.match(/href="#([^"]+)"/);
      if (m) return m[1];
    }
    return "";
  }
  function iconName(spriteId, label) {
    let name = (spriteId || "").toLowerCase().replace(/_/g, "-").replace(/^brand-/, "").replace(/-s$/, "");
    if (!name) name = (label || "").toLowerCase().trim().split(/\s+/).pop() || "";
    return name.replace(/[^a-z0-9-]/g, "");
  }
  function labelText(anchor) {
    const desktop = anchor.querySelector(".hide-on-mobile");
    const source = desktop || anchor.querySelector("span") || anchor;
    const clone = source.cloneNode(true);
    clone.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function parse2(element, { document: document2 }) {
    let anchors = [...element.querySelectorAll("homepage-b-link")].map((item) => item.querySelector("a[href]")).filter(Boolean);
    if (!anchors.length) {
      anchors = [...element.querySelectorAll(".homepage-b-links__links a[href]")];
    }
    const cells = [];
    anchors.forEach((anchor) => {
      const label = labelText(anchor);
      const name = iconName(spriteIdFromIcon(anchor), label);
      const iconCell = name ? `:${name}:` : "";
      const link = document2.createElement("a");
      link.href = anchor.getAttribute("href");
      link.textContent = label;
      cells.push([iconCell, link]);
    });
    const form = element.querySelector("form.homepage-b-links__track, form");
    if (form || anchors.length) {
      const input = form == null ? void 0 : form.querySelector("input");
      const button = form == null ? void 0 : form.querySelector("button");
      const hint = document2.createElement("p");
      hint.textContent = ((input == null ? void 0 : input.getAttribute("placeholder")) || (input == null ? void 0 : input.getAttribute("aria-label")) || "").trim() || "Tracking number";
      const trackP = document2.createElement("p");
      const track = document2.createElement("a");
      track.href = TRACK_URL;
      track.textContent = ((button == null ? void 0 : button.textContent) || "").trim() || "Track";
      trackP.append(track);
      cells.push([[hint, trackP]]);
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-quick-actions", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/notification-info.js
  function parse3(element, { document: document2 }) {
    const contents = element.querySelector(".fxg-notifications__contents") || element;
    const cell = [];
    const heading = contents.querySelector(".fxg-notifications__contents__heading");
    if (heading && heading.textContent.trim()) {
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      strong.textContent = heading.textContent.trim();
      p.append(strong);
      cell.push(p);
    }
    let paragraphs = [...contents.querySelectorAll(".cc-aem-c-richtext p, .richtext p")];
    if (!paragraphs.length) {
      paragraphs = [...contents.querySelectorAll("p")].filter((p) => p !== heading);
    }
    paragraphs = paragraphs.filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim());
    cell.push(...paragraphs);
    if (!cell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[cell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "notification-info", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-features.js
  function isHiddenEverywhere(el) {
    const hidden = el.closest(".fxg-desktop--hide.fxg-tablet--hide.fxg-mobile--hide");
    return !!hidden;
  }
  function parse4(element, { document: document2 }) {
    const textCol = element;
    const left = [];
    const titleEl = textCol.querySelector(".fxg-title, h1, h2, h3");
    if (titleEl && titleEl.textContent.trim()) {
      const h2 = document2.createElement("h2");
      h2.innerHTML = titleEl.innerHTML.trim();
      left.push(h2);
    }
    const richtexts = [...textCol.querySelectorAll(".cc-aem-c-richtext")].filter((rt) => !isHiddenEverywhere(rt));
    richtexts.forEach((rt) => {
      [...rt.querySelectorAll(":scope > p")].forEach((p) => {
        if (!p.textContent.trim()) return;
        p.querySelectorAll("b").forEach((b) => {
          const strong = document2.createElement("strong");
          strong.append(...b.childNodes);
          b.replaceWith(strong);
        });
        left.push(p);
      });
    });
    const right = [];
    const img = element.querySelector(".image_v2 .fxg-desktop-image img") || element.querySelector(".image_v2 img, .fxg-image-component img") || [...element.querySelectorAll("img")].find((i) => !i.closest(".richtext, .cc-aem-c-richtext")) || null;
    if (img) right.push(img);
    if (!left.length && !right.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[left, right.length ? right : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-features", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-services.js
  function parse5(element, { document: document2 }) {
    let cards = [...element.querySelectorAll(".title_v1")].map((title) => title.closest(".fxg-col") || title.closest(".aem-Grid") || title.parentElement).filter((c, i, arr) => c && arr.indexOf(c) === i);
    if (!cards.length) {
      cards = [...element.querySelectorAll(":scope > .row > .fxg-col")];
    }
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(".fxg-desktop-image img") || card.querySelector(".image_v2 img, .fxg-image-component img, img");
      const text = [];
      const titleEl = card.querySelector(".fxg-title, h2, h3, h4, h5, h6");
      if (titleEl && titleEl.textContent.trim()) {
        const h3 = document2.createElement("h3");
        h3.innerHTML = titleEl.innerHTML.trim();
        text.push(h3);
      }
      [...card.querySelectorAll(".cc-aem-c-richtext p, .richtext p")].filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim()).forEach((p) => text.push(p));
      [...card.querySelectorAll(".button_v1 a[href], .fxg-button-link a[href]")].filter((a, i, arr) => arr.indexOf(a) === i).forEach((a) => {
        const p = document2.createElement("p");
        p.append(a);
        text.push(p);
      });
      if (!img && !text.length) return;
      cells.push([img || "", text]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-services", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-offer.js
  function parse6(element, { document: document2 }) {
    const detail = element.querySelector(".fxg-featured-offer__detail") || element;
    const text = [];
    const titleEl = detail.querySelector(".fxg-title, h2, h3, h4, h5");
    if (titleEl && titleEl.textContent.trim()) {
      const h3 = document2.createElement("h3");
      h3.innerHTML = titleEl.innerHTML.trim();
      text.push(h3);
    }
    [...detail.querySelectorAll(".cc-aem-c-richtext p, .richtext p")].filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim()).forEach((p) => text.push(p));
    const links = [...detail.querySelectorAll(".button_v1 a[href], .fxg-button-link a[href]")];
    if (!links.length) {
      const featured = element.querySelector("a.fxg-featured-button");
      const href = featured ? featured.getAttribute("href") || "" : "";
      if (featured && !featured.classList.contains("hidden") && href && href !== "/#" && href !== "#") {
        links.push(featured);
      }
    }
    links.filter((a, i, arr) => arr.indexOf(a) === i).forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      text.push(p);
    });
    const img = element.querySelector(".fxg-featured-offer__detail-image img") || [...element.querySelectorAll("img")].find((i) => !i.closest(".fxg-featured-offer__detail")) || null;
    if (img && /^(null|undefined)$/i.test((img.getAttribute("alt") || "").trim())) {
      img.setAttribute("alt", "");
    }
    if (!text.length && !img) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[text, img || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-offer", cells });
    block.classList.add("featured_offer_v2");
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-horizontal.js
  var CONSUMED = "data-excat-cards-horizontal";
  function isCard(el) {
    return !!el && el.classList.contains("column_control_v1") && !!el.querySelector(".image_v2, .fxg-image-component") && !!el.querySelector(".title_v1, .fxg-title");
  }
  function isSkippable(el) {
    return !!el && (el.classList.contains("spacer") || el.classList.contains("personalization-slot"));
  }
  function prevCard(el) {
    let p = el.previousElementSibling;
    while (p && isSkippable(p)) p = p.previousElementSibling;
    return isCard(p) && !p.hasAttribute(CONSUMED) ? p : null;
  }
  function nextCard(el) {
    let n = el.nextElementSibling;
    while (n && isSkippable(n)) n = n.nextElementSibling;
    return isCard(n) && !n.hasAttribute(CONSUMED) ? n : null;
  }
  function buildRow(card, document2) {
    const img = card.querySelector(".image_v2 .fxg-desktop-image img") || card.querySelector(".image_v2 img, .fxg-image-component img, img");
    const text = [];
    const titleEl = card.querySelector(".title_v1 .fxg-title, .fxg-title, h2, h3, h4, h5");
    if (titleEl && titleEl.textContent.trim()) {
      const h3 = document2.createElement("h3");
      h3.innerHTML = titleEl.innerHTML.trim();
      text.push(h3);
    }
    [...card.querySelectorAll(".cc-aem-c-richtext p, .richtext p")].filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim()).forEach((p) => text.push(p));
    [...card.querySelectorAll(".button_v1 a[href], .fxg-button-link a[href]")].filter((a, i, arr) => arr.indexOf(a) === i).forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      text.push(p);
    });
    if (!img && !text.length) return null;
    return [img || "", text];
  }
  function parse7(element, { document: document2 }) {
    if (element.hasAttribute(CONSUMED) || !element.parentElement) return;
    let first = element;
    let p = prevCard(first);
    while (p) {
      first = p;
      p = prevCard(first);
    }
    const group = [first];
    let n = nextCard(first);
    while (n) {
      group.push(n);
      n = nextCard(n);
    }
    const cells = group.map((card) => buildRow(card, document2)).filter(Boolean);
    group.forEach((card) => card.setAttribute(CONSUMED, ""));
    if (!cells.length) {
      element.removeAttribute(CONSUMED);
      element.replaceWith(...element.childNodes);
      return;
    }
    group.slice(1).forEach((card) => {
      const placeholder = document2.createElement("div");
      placeholder.setAttribute(CONSUMED, "");
      card.replaceWith(placeholder);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-horizontal", cells });
    if (element === first) {
      element.replaceWith(block);
    } else {
      first.replaceWith(block);
    }
  }

  // tools/importer/transformers/fedex-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var MAIN_GRID = ".fxg-main-content .cmp-container > .experiencefragment:first-child .xf-content-height > .aem-Grid";
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "fedex-cookie-consent",
        // <fedex-cookie-consent> inside header
        "#usercentrics-cmp-ui",
        // <aside id="usercentrics-cmp-ui">
        "#uc-cross-domain-consent-sharing-bridge",
        // consent iframe
        ".browser-support",
        // unsupported-browser modal
        "#nuanMessagingFrame",
        // Nuance chat widget
        "#inqDivResizeCorner",
        "#inqResizeBox",
        "#inqTitleBar",
        "#cubeOnePar-tab",
        // hidden hero apps (rate/ship, etc.)
        "#cubeThreePar-tab",
        ".homepage-a-hero_caption-overlay",
        // hero caption overlay text
        ".homepage-a-hero_controls"
        // hero video play/pause buttons
      ]);
      element.querySelectorAll("a.fxg-button--transparent, a.fxg-button--orange").forEach((a) => {
        if (a.closest("strong")) return;
        const strong = document.createElement("strong");
        a.replaceWith(strong);
        if (a.classList.contains("fxg-button--orange")) {
          const em = document.createElement("em");
          em.append(a);
          strong.append(em);
        } else {
          strong.append(a);
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.fxg-header",
        "footer.fxg-footer",
        ".breadcrumbs_v1",
        "fedex-smart-banner",
        "fedex-alert-header",
        "fedex-alert-footer",
        "fedex-geo-locator",
        ".js-geo-locator",
        "#fedex-abtest-icon-sprite"
      ]);
      WebImporter.DOMUtils.remove(element, [
        `${MAIN_GRID} > .advanced_table_v1`,
        // hidden icon-link table
        `${MAIN_GRID} > .column_control_v1.at-element-marker`,
        // hidden icon-link column_control before features
        `${MAIN_GRID} > .featured_offer_v2 + .column_control_v1`
        // mobile-only copy of featured offer
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".spacer",
        ".personalization-slot"
      ]);
      WebImporter.DOMUtils.remove(element, [
        '[id^="batBeacon"]',
        "iframe",
        "script",
        "noscript",
        "link",
        "style",
        "input"
      ]);
      element.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.startsWith("blob:") || /scriptseai\d*\.fedex\.com/.test(src)) {
          (img.closest("picture") || img).remove();
        }
      });
      const mainContent = element.querySelector(".fxg-main-content");
      if (mainContent) {
        [...element.children].forEach((child) => {
          if (child !== mainContent && !child.contains(mainContent)) child.remove();
        });
      }
    }
  }

  // tools/importer/transformers/fedex-sections.js
  var MARKER_PREFIX = "excat-section:";
  var SHOW_COMMENT = 128;
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function findMarkers(root) {
    const doc = root.ownerDocument || document;
    const walker = doc.createTreeWalker(root, SHOW_COMMENT);
    const markers = {};
    let node = walker.nextNode();
    while (node) {
      const text = (node.nodeValue || "").trim();
      if (text.startsWith(MARKER_PREFIX)) markers[text.slice(MARKER_PREFIX.length)] = node;
      node = walker.nextNode();
    }
    return markers;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        sectionEl.before(document.createComment(`${MARKER_PREFIX}${section.id}`));
      }
    }
    if (hookName === "afterTransform") {
      const markers = findMarkers(element);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        let nextMarker = null;
        for (let j = i + 1; j < sections.length && !nextMarker; j += 1) {
          nextMarker = markers[sections[j].id] || null;
        }
        if (nextMarker) {
          nextMarker.before(metadataBlock);
        } else {
          const anchor = markers[section.id] || querySection(element, section.selector);
          if (!anchor) continue;
          anchor.after(metadataBlock);
        }
      }
      sections.forEach((section, i) => {
        const marker = markers[section.id];
        if (!marker) return;
        if (i === 0) {
          marker.remove();
        } else {
          marker.replaceWith(document.createElement("hr"));
        }
      });
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-video": parse,
    "cards-quick-actions": parse2,
    "notification-info": parse3,
    "columns-features": parse4,
    "cards-services": parse5,
    "columns-offer": parse6,
    "cards-horizontal": parse7
  };
  var G = ".fxg-main-content .cmp-container > .experiencefragment:first-child .xf-content-height > .aem-Grid";
  var PAGE_TEMPLATE = {
    name: "home",
    description: "FedEx US homepage: video hero with quick actions, info notice, feature columns, service cards, featured offer, horizontal promo cards and legal notes",
    urls: [
      "https://www.fedex.com/en-us/home.html"
    ],
    blocks: [
      { name: "hero-video", instances: [".fxg-hero_homepage .fxg-hero__header"] },
      { name: "cards-quick-actions", instances: [".fxg-hero_homepage div.homepage-b-links"] },
      { name: "notification-info", instances: [".fxg-notifications--theme-informational"] },
      { name: "columns-features", instances: [`${G} > .column_control_v1:has(.column_control_v1)`] },
      { name: "cards-services", instances: [`${G} > .title_v1:nth-child(10) ~ .column_control_v1:nth-child(12)`] },
      { name: "columns-offer", instances: [".featured_offer_v2"] },
      { name: "cards-horizontal", instances: [`${G} > .title_v1:nth-child(19) ~ .column_control_v1`] }
    ],
    sections: [
      {
        id: "1",
        name: "Hero with quick actions",
        selector: [".hero_homepage_v1"],
        style: null,
        blocks: ["hero-video", "cards-quick-actions"],
        defaultContent: []
      },
      {
        id: "2",
        name: "Informational notice",
        selector: [`${G} > .notifications`],
        style: null,
        blocks: ["notification-info"],
        defaultContent: []
      },
      {
        id: "3",
        name: "Why ship with FedEx",
        selector: [`${G} > .column_control_v1:has(.column_control_v1)`],
        style: "grey",
        blocks: ["columns-features"],
        defaultContent: [`${G} > .column_control_v1:nth-child(8)`]
      },
      {
        id: "4",
        name: "Delivery that works around you",
        selector: [`${G} > .title_v1:nth-child(10)`],
        style: null,
        blocks: ["cards-services"],
        defaultContent: [`${G} > .title_v1:nth-child(10)`]
      },
      {
        id: "5",
        name: "Go global with confidence",
        selector: [`${G} > .title_v1:nth-child(14)`],
        style: null,
        blocks: ["columns-offer"],
        defaultContent: [`${G} > .title_v1:nth-child(14)`]
      },
      {
        id: "6",
        name: "Smarter shipping for growing businesses + legal notes",
        selector: [`${G} > .title_v1:nth-child(19)`],
        style: null,
        blocks: ["cards-horizontal"],
        defaultContent: [
          `${G} > .title_v1:nth-child(19)`,
          ".fxg-main-content .cmp-container > .experiencefragment:nth-child(2)"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: [...new Set(pageBlocks.map((b) => b.name))]
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
