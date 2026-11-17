import { siteConfig as site } from './data/site-config.js';
import { videoEmbeds } from './data/video-embeds.js';

const app = document.querySelector('#app');
const header = document.querySelector('#site-header');
const footer = document.querySelector('#site-footer');
let media = {};

try { media = await (await fetch('./data/media-manifest.json')).json(); } catch { /* preview remains usable without a manifest */ }

const route = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
const href = path => `#/${path}`;
const projectList = category => site.sections[category].map(slug => ({ slug, ...site.projects[slug] }));

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
      <a href="${site.educationUrl}" target="_blank" rel="noreferrer">Education <i>↗</i></a>
      <a href="${href('about')}">About</a>
      <a href="${href('service')}">Service</a>
    </nav>`;
  footer.innerHTML = `<p>© ${new Date().getFullYear()} 王書駿 · WANG SHU JUN</p><div><a href="${site.social.instagram}" target="_blank" rel="noreferrer">Instagram</a><a href="${site.social.facebook}" target="_blank" rel="noreferrer">Facebook</a></div>`;
  const button = header.querySelector('.menu-toggle');
  button.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    button.setAttribute('aria-expanded', isOpen);
  });

  // 點擊子選單項目後，自動關閉手機版選單並讓 hover 狀態重置
  header.querySelectorAll('.nav-submenu a').forEach(link => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
      link.blur();
    });
  });

  // 修正點 1 & 2：攔截 Creation 與 Production 父層點擊不導向空白頁面，並在平板/手機點擊時切換/關閉子選單
  header.querySelectorAll('.nav-menu').forEach(menuGroup => {
    const parentLink = menuGroup.querySelector('.nav-parent');
    parentLink.addEventListener('click', (e) => {
      // 判斷是否為觸控裝置或行動版尺寸
      if (window.matchMedia('(max-width: 1024px)').pointer === 'coarse' || window.innerWidth <= 1024) {
        e.preventDefault();
        const isOpen = menuGroup.classList.toggle('submenu-open');
        // 關閉其他同級選單
        header.querySelectorAll('.nav-menu').forEach(other => {
          if (other !== menuGroup) other.classList.remove('submenu-open');
        });
      }
    });
  });
}

function menu(label, category) {
  return `<div class="nav-menu"><a class="nav-parent" href="${href(category)}">${label}</a><div class="nav-submenu">${projectList(category).map(project => `<a href="${href(`${category}/${project.slug}`)}">${project.title}</a>`).join('')}</div></div>`;
}

function home() {
  const card = (label, sub, path, external = false) => `
    <a class="portal-card ${label.toLowerCase()}" href="${external ? site.educationUrl : href(path)}" ${external ? 'target="_blank" rel="noreferrer"' : ''}>
      <span class="portal-image" data-cover="${label.toLowerCase()}"></span><span class="portal-label">${label}</span><small>${sub}${external ? ' ↗' : ''}</small>
    </a>`;
  app.innerHTML = `<section class="home-hero" aria-label="作品入口">
    <div class="portal-grid">${card('Production', 'Photography & Film', 'production')}${card('Creation', 'Art Projects', 'creation')}${card('Education', 'James Gaze', '', true)}</div>
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
  app.innerHTML = `<section class="listing"><p class="eyebrow">Selected Works</p><h1>${label}</h1><div class="project-index">${projectList(category).map(project => `
    <a href="${href(`${category}/${project.slug}`)}" class="project-link"><span>${project.title}</span><i>→</i></a>`).join('')}</div></section>`;
}

function videoEmbed(url) {
  const id = url.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1];
  return id ? `<div class="video"><div class="video-frame"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>` : '';
}

function emptyProject(slug) {
  return `<div class="empty-state"><p>此系列正在整理中。</p><code>assets/${site.projects[slug].category}/${slug}/</code></div>`;
}

function projectPage(slug) {
  const project = site.projects[slug];
  if (!project) return notFound();
  const items = [...(media[slug] || []), ...(videoEmbeds[slug] || []).map(src => ({ type: 'youtube', src }))];
  const photos = items.filter(item => item.type === 'image');
  const videos = items.filter(item => item.type === 'video' || item.type === 'youtube');
  let content = '';
  if (!items.length) content = emptyProject(slug);
  else if (project.layout === 'masonry') content = `<div class="masonry">${photos.map((item, i) => `<button class="media-button" data-index="${i}"><img src="${item.src}" alt="${project.title} ${i + 1}" loading="lazy"></button>`).join('')}</div>`;
  else if (project.layout === 'slider') {
    content = `<div class="slider" data-slider><button class="slide-control previous" aria-label="上一張">←</button><div class="slide-track" data-track>${photos.map((item, i) => `<figure class="slide"><img src="${item.src}" alt="${project.title} ${i + 1}"></figure>`).join('')}</div><button class="slide-control next" aria-label="下一張">→</button></div>`;
  } else {
    // 修正點 6：針對影片數量較多的頁面（如 commercial-film），改用分批載入或原生 loading="lazy" 避免手機一次載入過多 iframe 當機
    content = `<div class="storyboard ${videos.length > 1 ? 'video-gallery' : ''}">${videos.map((item, i) => item.type === 'youtube' ? videoEmbed(item.src) : `<video src="${item.src}" controls preload="none" loading="lazy"></video>`).join('')}${photos.map((item, i) => `<img src="${item.src}" alt="${project.title} ${i + 1}" loading="lazy">`).join('')}</div>`;
  }
  const description = project.description?.length ? `<section class="project-description">${project.description.map(text => `<p>${text}</p>`).join('')}</section>` : '';
  app.innerHTML = `<article class="project project-${project.layout}"><header class="project-heading"><p class="eyebrow">${project.category}</p><h1>${project.title}</h1>${project.year ? `<p>${project.year}</p>` : ''}${description}</header>${content}</article>`;
  if (project.layout === 'slider' && photos.length) setupSlider();
  if (project.layout === 'masonry' && photos.length) setupLightbox(photos, project.title);
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
  const dialog = document.createElement('dialog'); dialog.className = 'lightbox'; document.body.append(dialog);
  let current = 0;
  const draw = () => dialog.innerHTML = `<button class="close" aria-label="關閉">×</button><button class="previous" aria-label="上一張">←</button><img src="${items[current].src}" alt="${projectTitle} ${current + 1}"><button class="next" aria-label="下一張">→</button>`;
  const open = index => { current = index; draw(); dialog.showModal(); };
  document.querySelectorAll('.media-button').forEach(button => button.onclick = () => open(Number(button.dataset.index)));
  dialog.onclick = event => { if (event.target === dialog || event.target.matches('.close')) dialog.close(); if (event.target.matches('.previous')) { current = (current - 1 + items.length) % items.length; draw(); } if (event.target.matches('.next')) { current = (current + 1) % items.length; draw(); } };
}

function about() { 
  app.innerHTML = `<article class="text-page about-page">
    <header class="about-heading"><p class="eyebrow">About</p><h1>About Me</h1></header>
    <section class="about-intro">
      <img class="about-portrait" src="./assets/about.jpg" alt="王書駿" onerror="this.remove()">
      <div class="about-copy">
        <h2>王 書駿　WANG SHU JUN</h2>
        <p class="about-role">VISUAL ARTIST + PHOTOGRAPHER + D.P. + INSTRUCTOR<br>BASED IN TAIPEI</p>
        <div class="about-body">
          <p>王書駿是台灣知名攝影師，以獨特的人文情感和黑白攝影風格聞名，專注於捕捉光影結構和人物情感；作品帶有沈靜、古典與抽象美感. 他的創作常運用二元論、矛盾修辭和影像的弔詭性，探討生命無常與時光消逝等主題.</p>
          <p>在商業領域，他擅長肖像、靜物攝影及廣告影片製作，並在廣告拍攝與內容行銷方面有豐富經驗. 作為攝影教育工作者，他在視丘攝影藝術學院開設課程，並在多所大學和企業開辦講座和工作坊，其善於啟發學生創造力和思維方式，幫助他們從生活經驗中尋找攝影靈感.</p>
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
  const steps=[['01','需求確認','了解預計製作內容、規模、類型、數量、露出位置與預算範圍.'],['02','初步提案','以參考資料建立初步共識，確認製作方向與合作意願.'],['03','正式提案與報價','確立詳細計畫內容，建立合約與報價單.'],['04','製作階段','前期畫面設計、道具、時程與場地；中期拍攝、燈光與收音；後期備檔、選片、修圖、調色與剪輯.'],['05','結案','依案件類型，以雲端硬碟或實體硬碟交付檔案.']]; 
  app.innerHTML = `<article class="text-page service-page"><p class="eyebrow">Service</p><h1>Service Process</h1><ol class="process">${steps.map(step=>`<li><b>${step[0]}</b><div><strong>${step[1]}</strong><p>${step[2]}</p></div></li>`).join('')}</ol><p class="contact-intro">歡迎各種形式合作與委託.</p><a class="email-link" href="mailto:${site.email}">${site.email} <i>↗</i></a></article>`; 
}

function notFound() { app.innerHTML = `<section class="not-found"><h1>Page not found</h1><a href="${href('')}">回到首頁</a></section>`; }

function render() { 
  document.onkeydown = null; 
  const [section, slug] = route(); 
  if (!section) home(); 
  else if ((section === 'creation' || section === 'production') && !slug) indexPage(section); 
  else if ((section === 'creation' || section === 'production') && slug) projectPage(slug); 
  else if (section === 'about') about(); 
  else if (section === 'service') service(); 
  else notFound(); 
  header.classList.remove('menu-open'); 
  window.scrollTo({ top: 0, behavior: 'instant' }); 
}

renderChrome(); window.addEventListener('hashchange', render); render();
