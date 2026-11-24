import { siteConfig as site } from './data/site-config.js';
import { videoEmbeds } from './data/video-embeds.js';

const app = document.querySelector('#app');
const header = document.querySelector('#site-header');
const footer = document.querySelector('#site-footer');

const SITE_TITLE = 'WANG SHU JUN';
const DEFAULT_TITLE = 'WANG SHU JUN — Visual Artist';

let media = {};
let mediaLoaded = false;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const setTitle = text => { document.title = text; };

const route = () => location.hash
  .replace(/^#\/?/, '')
  .split('/')
  .filter(Boolean)
  .map(part => { try { return decodeURIComponent(part); } catch { return part; } });
const href = path => `#/${path}`;
const projectList = category => site.sections[category].map(slug => ({ slug, ...site.projects[slug] }));

// Education 連結：加上來源標記，讓凝視潛像網站的 GA 看得出訪客來自作品集
const educationHref = (() => {
  try {
    const url = new URL(site.educationUrl);
    url.searchParams.set('utm_source', 'portfolio');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'education');
    return url.toString();
  } catch {
    return site.educationUrl;
  }
})();

/* ---------- 分析（GA 未啟用時，以下函式都不會做任何事） ---------- */

function track(name, params = {}) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  } catch { /* 分析工具出錯不能影響網站 */ }
}

// 單頁式網站用 # 切換，GA 看不到，所以每次換頁手動送一個虛擬路徑，例如 /portfolio/production/xxx
function virtualUrl() {
  const base = (location.origin + location.pathname).replace(/index\.html$/, '').replace(/\/?$/, '/');
  return base + route().join('/');
}
function trackPage() {
  track('page_view', { page_title: document.title, page_location: virtualUrl() });
}

/* ---------- 版頭與頁尾 ---------- */

function renderChrome() {
  header.innerHTML = `
    <a class="brand" href="${href('')}" aria-label="${site.name}，回到首頁">
      <img class="logo-desktop" src="./assets/logo1.png" alt="${site.name}">
      <img class="logo-mobile" src="./assets/logo1.png" alt="${site.name}">
      <span>${site.name}</span>
      <small>${site.role}</small>
    </a>
    <button class="menu-toggle" aria-label="開啟導覽選單" aria-expanded="false">
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
    </button>
    <nav aria-label="主要導覽">
      ${menu('Creation', 'creation')}
      ${menu('Production', 'production')}
      <a href="${educationHref}" target="_blank" rel="noreferrer" data-track="education_click">Education <i>↗</i></a>
      <a href="${href('about')}">About</a>
      <a href="${href('service')}">Service</a>
    </nav>`;
  footer.innerHTML = `<p>© ${new Date().getFullYear()} 王書駿 · WANG SHU JUN</p><div><a href="${site.social.instagram}" target="_blank" rel="noreferrer">Instagram</a><a href="${site.social.facebook}" target="_blank" rel="noreferrer">Facebook</a></div>`;
  const button = header.querySelector('.menu-toggle');
  button.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    button.setAttribute('aria-expanded', isOpen);
  });

  // 點擊任何子選單項目後，立即關閉導覽與子選單
  header.querySelectorAll('.nav-submenu a').forEach(link => {
    link.addEventListener('click', () => {
      closeAllMenus();
      link.blur();
    });
  });

  // 點擊外部關閉
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      closeAllMenus();
    }
  });

  // 平板/觸控點擊父層切換子選單
  header.querySelectorAll('.nav-menu').forEach(menuGroup => {
    const parentLink = menuGroup.querySelector('.nav-parent');
    parentLink.addEventListener('click', (e) => {
      if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024) {
        e.preventDefault();
        const isOpen = menuGroup.classList.contains('submenu-open');
        header.querySelectorAll('.nav-menu').forEach(other => other.classList.remove('submenu-open'));
        if (!isOpen) {
          menuGroup.classList.add('submenu-open');
        }
      }
    });
  });
}

// 統一關閉所有選單與子選單的函式
function closeAllMenus() {
  header.classList.remove('menu-open');
  const toggleBtn = header.querySelector('.menu-toggle');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  header.querySelectorAll('.nav-menu').forEach(m => m.classList.remove('submenu-open'));
}

function menu(label, category) {
  return `<div class="nav-menu"><a class="nav-parent" href="${href(category)}">${label}</a><div class="nav-submenu">${projectList(category).map(project => `<a href="${href(`${category}/${project.slug}`)}">${project.title}</a>`).join('')}</div></div>`;
}

/* ---------- 頁面 ---------- */

function home() {
  setTitle(DEFAULT_TITLE);
  const card = (label, sub, path, external = false) => `
    <a class="portal-card ${label.toLowerCase()}" href="${external ? educationHref : href(path)}" ${external ? 'target="_blank" rel="noreferrer" data-track="education_click"' : ''}>
      <span class="portal-image" data-cover="${label.toLowerCase()}"></span><span class="portal-label">${label}</span><small>${sub}${external ? ' ↗' : ''}</small>
    </a>`;
  app.innerHTML = `<section class="home-hero" aria-label="作品入口">
    <div class="portal-grid">${card('Production', 'Photography & Film', 'production')}${card('Creation', 'Art Projects', 'creation')}${card('Education', '凝視潛像 JAMES GAZE', '', true)}</div>
  </section>`;
  addCovers();
}

function addCovers() {
  for (const el of document.querySelectorAll('[data-cover]')) {
    const name = el.dataset.cover;
    el.style.backgroundImage = `linear-gradient(180deg, transparent 50%, rgba(0,0,0,.45)), url('./assets/covers/${name}.jpg')`;
  }
}

function indexPage(category) {
  const label = category === 'creation' ? 'Creation' : 'Production';
  setTitle(`${label} — ${SITE_TITLE}`);
  app.innerHTML = `<section class="listing"><p class="eyebrow">Selected Works</p><h1>${label}</h1><div class="project-index">${projectList(category).map(project => `
    <a href="${href(`${category}/${project.slug}`)}" class="project-link"><span>${project.title}</span><i>→</i></a>`).join('')}</div></section>`;
}

// 影片：先顯示縮圖與播放鈕，點了才載入 YouTube 播放器（同時間只保留一個），
// 避免一次載入數十個播放器造成 iPhone 記憶體不足而當機
function youtubeId(url) {
  return url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1];
}

function videoFacade(id) {
  return `<button class="video-facade" type="button" data-video-id="${id}" aria-label="播放影片"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async"><span class="video-play" aria-hidden="true"></span></button>`;
}

function videoEmbed(url) {
  const id = youtubeId(url);
  return id ? `<div class="video"><div class="video-frame">${videoFacade(id)}</div></div>` : '';
}

function restoreVideo(iframe) {
  const frame = iframe.parentElement;
  if (frame) frame.innerHTML = videoFacade(iframe.dataset.yt);
}

function activateVideo(button) {
  const id = button.dataset.videoId;
  const frame = button.parentElement;
  if (!id || !frame) return;
  app.querySelectorAll('iframe[data-yt]').forEach(restoreVideo);
  frame.innerHTML = `<iframe data-yt="${id}" src="https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  track('video_play', { video_id: id });
}

function emptyProject(slug) {
  return `<div class="empty-state"><p>此系列正在整理中。</p><code>assets/${site.projects[slug].category}/${slug}/</code></div>`;
}

function projectPage(slug) {
  const project = hasOwn(site.projects, slug) ? site.projects[slug] : null;
  if (!project) return notFound();
  setTitle(`${project.title} — ${SITE_TITLE}`);

  const photoAndVideo = hasOwn(media, slug) && Array.isArray(media[slug]) ? media[slug] : [];
  const embeds = hasOwn(videoEmbeds, slug) ? videoEmbeds[slug] : [];
  const items = [...photoAndVideo, ...embeds.map(src => ({ type: 'youtube', src }))];
  const photos = items.filter(item => item.type === 'image');
  const videos = items.filter(item => item.type === 'video' || item.type === 'youtube');

  // 版型是瀑布流或輪播，但這個作品沒有圖片（只有影片）時，改用影片版型，避免空白頁
  let layout = project.layout;
  if ((layout === 'masonry' || layout === 'slider') && !photos.length) layout = 'storyboard';

  let content = '';
  if (!items.length) {
    // 圖片清單還在載入時先不顯示「整理中」，載入完成後會自動重畫
    content = mediaLoaded ? emptyProject(slug) : '';
  } else if (layout === 'masonry') {
    // 恢復你原本流暢好看的傳統多欄瀑布流，並加入自動防錯位微調
    content = `<div class="masonry">${photos.map((item, i) => `<div class="masonry-item"><button class="media-button" data-index="${i}"><img src="${item.src}" alt="${project.title} ${i + 1}" loading="lazy" decoding="async"${item.width && item.height ? ` width="${item.width}" height="${item.height}"` : ''}></button></div>`).join('')}</div>`;
  } else if (layout === 'slider') {
    content = `<div class="slider" data-slider><button class="slide-control previous" aria-label="上一張">←</button><div class="slide-track" data-track>${photos.map((item, i) => `<figure class="slide"><img src="${item.src}" alt="${project.title} ${i + 1}"></figure>`).join('')}</div><button class="slide-control next" aria-label="下一張">→</button></div>`;
  } else {
    content = `<div class="storyboard ${videos.length > 1 ? 'video-gallery' : ''}">${videos.map(item => item.type === 'youtube' ? videoEmbed(item.src) : `<video src="${item.src}" controls preload="none"></video>`).join('')}${photos.map((item, i) => `<img src="${item.src}" alt="${project.title} ${i + 1}" loading="lazy">`).join('')}</div>`;
  }
  const description = project.description?.length ? `<section class="project-description">${project.description.map(text => `<p>${text}</p>`).join('')}</section>` : '';
  app.innerHTML = `<article class="project project-${project.layout}"><header class="project-heading"><p class="eyebrow">${project.category}</p><h1>${project.title}</h1>${project.year ? `<p>${project.year}</p>` : ''}${description}</header>${content}</article>`;
  if (layout === 'slider' && photos.length) setupSlider();
  if (layout === 'masonry' && photos.length) setupLightbox(photos, project.title);
}

function setupSlider() {
  const slider = document.querySelector('[data-slider]');
  const track = slider.querySelector('[data-track]');
  const move = direction => {
    const card = track.querySelector('.slide');
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };
  slider.querySelector('.previous').onclick = () => move(-1);
  slider.querySelector('.next').onclick = () => move(1);
  document.onkeydown = event => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); };
}

function setupLightbox(items, projectTitle) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  document.body.append(dialog);
  let current = 0;

  const draw = () => {
    dialog.innerHTML = `<button class="close" aria-label="關閉">×</button><button class="previous" aria-label="上一張">←</button><img src="${items[current].src}" alt="${projectTitle} ${current + 1}"><button class="next" aria-label="下一張">→</button>`;
  };
  const step = direction => {
    current = (current + direction + items.length) % items.length;
    draw();
  };
  // 左右鍵切換；Esc 由瀏覽器內建關閉
  const onKey = event => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  };
  const open = index => {
    current = index;
    draw();
    dialog.showModal();
    document.addEventListener('keydown', onKey);
    track('lightbox_open', { project_title: projectTitle, image_index: index + 1 });
  };

  dialog.addEventListener('close', () => document.removeEventListener('keydown', onKey));
  document.querySelectorAll('.media-button').forEach(button => button.onclick = () => open(Number(button.dataset.index)));
  dialog.onclick = event => {
    if (event.target === dialog || event.target.matches('.close')) dialog.close();
    if (event.target.matches('.previous')) step(-1);
    if (event.target.matches('.next')) step(1);
  };
}

function about() {
  setTitle(`About — ${SITE_TITLE}`);
  app.innerHTML = `<article class="text-page about-page">
    <header class="about-heading"><p class="eyebrow">About</p><h1>About Me</h1></header>
    <section class="about-intro">
      <img class="about-portrait" src="./assets/about.jpg" alt="王書駿" onerror="this.remove()">
      <div class="about-copy">
        <h2>王 書駿　WANG SHU JUN</h2>
        <p class="about-role">VISUAL ARTIST + PHOTOGRAPHER + D.P. + INSTRUCTOR<br>BASED IN TAIPEI</p>
        <div class="about-body">
          <p>王書駿是台灣知名攝影師，以獨特的人文情感和黑白攝影風格聞名，專注於捕捉光影結構和人物情感；作品帶有沉靜、古典與抽象美感。他的創作常運用二元論、矛盾修辭和影像的弔詭性，探討生命無常與時光消逝等主題。</p>
          <p>在商業領域，他擅長肖像、靜物攝影及廣告影片製作，並在廣告拍攝與內容行銷方面有豐富經驗。作為攝影教育工作者，他在視丘攝影藝術學院開設課程，並在多所大學和企業開辦講座和工作坊，其善於啟發學生創造力和思維方式，幫助他們從生活經驗中尋找攝影靈感。</p>
        </div>
      </div>
    </section>
    <section class="bio-list">
      <h2>現任</h2>
      <p>2022至今　視丘攝影藝術學院《攝影指導養成所》講師<br>2020至今　視丘攝影藝術學院《林布蘭與現代商業人像採光》講師<br>2019至今　自由接案攝影師</p>
      <h2>獲獎</h2>
      <p>2022 ipa, Official Selection<br>2022 PX3, Honorable Mention<br>2022 Hidden Stories Beyond Addresses Challenge, 3rd Prize, Best Story<br>2022 Hidden Stories Beyond Addresses Challenge, Three Honorable Mention, Best Photo<br>2019 麥味登微電影劇情篇 銀盤獎<br>2005 Fnac《24小時城市數位攝影馬拉松》攝影比賽 北區首獎</p>
      <h2>聯展</h2>
      <p>2005 Fnac《24小時城市數位攝影馬拉松》, Fnac藝廊<br>2000《毒影》, 中央大學藝文中心</p>
    </section>
  </article>`;
}

function service() {
  setTitle(`Service — ${SITE_TITLE}`);
  const steps = [
    ['01', '需求確認', '了解預計製作內容、規模、類型、數量、露出位置與預算範圍。'],
    ['02', '初步提案', '以參考資料建立初步共識，確認製作方向與合作意願。'],
    ['03', '正式提案與報價', '確立詳細計畫內容，建立合約與報價單。'],
    ['04', '製作階段', '前期畫面設計、道具、時程與場地；中期拍攝、燈光與收音；後期備檔、選片、修圖、調色與剪輯。'],
    ['05', '結案', '依案件類型，以雲端硬碟或實體硬碟交付檔案。']
  ];
  app.innerHTML = `<article class="text-page service-page"><p class="eyebrow">Service</p><h1>Service Process</h1><ol class="process">${steps.map(step => `<li><b>${step[0]}</b><div><strong>${step[1]}</strong><p>${step[2]}</p></div></li>`).join('')}</ol><p class="contact-intro">歡迎各種形式合作與委託。</p><a class="email-link" href="mailto:${site.email}">${site.email} <i>↗</i></a></article>`;
}

function notFound() {
  setTitle(`Page not found — ${SITE_TITLE}`);
  app.innerHTML = `<section class="not-found"><h1>Page not found</h1><a href="${href('')}">回到首頁</a></section>`;
}

/* ---------- 路由 ---------- */

// silent＝圖片清單載入完成後重畫目前頁面：不捲回頂端、不關選單、不重複記錄頁面瀏覽
function render({ silent = false } = {}) {
  document.onkeydown = null;
  // 清掉上一頁留下的燈箱，避免越積越多
  document.querySelectorAll('dialog.lightbox').forEach(dialog => {
    if (dialog.open) dialog.close();
    dialog.remove();
  });
  // 每次換頁時，強制關閉所有導覽選單與子目錄（解決平板點擊跳轉後子目錄殘留問題）
  if (!silent) closeAllMenus();

  const [section, slug] = route();
  if (!section) home();
  else if ((section === 'creation' || section === 'production') && !slug) indexPage(section);
  else if ((section === 'creation' || section === 'production') && slug) projectPage(slug);
  else if (section === 'about') about();
  else if (section === 'service') service();
  else notFound();

  if (!silent) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    trackPage();
  }
}

function loadManifest() {
  fetch('./data/media-manifest.json')
    .then(response => (response.ok ? response.json() : {}))
    .catch(() => ({})) // 沒有清單時網站仍可預覽
    .then(data => {
      media = data && typeof data === 'object' ? data : {};
      mediaLoaded = true;
      if (route()[1]) render({ silent: true });
    });
}

// 「跳至主要內容」只移動焦點，不改網址（否則會被當成路由而顯示 Page not found）
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
  skipLink.addEventListener('click', event => {
    event.preventDefault();
    app.focus();
  });
}

// 影片縮圖被點擊時才載入播放器
app.addEventListener('click', event => {
  const button = event.target.closest ? event.target.closest('.video-facade') : null;
  if (button) activateVideo(button);
});

// 點擊紀錄：Education 連結、聯絡 Email
document.addEventListener('click', event => {
  const link = event.target.closest ? event.target.closest('a') : null;
  if (!link) return;
  if (link.dataset.track) track(link.dataset.track, { link_url: link.href });
  else if (link.href.startsWith('mailto:')) track('contact_click', { method: 'email' });
});

renderChrome();
window.addEventListener('hashchange', () => render());
render();
loadManifest();
