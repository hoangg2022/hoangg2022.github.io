// ── 全局站点配置 ──
// fork 后只需改这个文件，整个站点自动更新

export const site = {
  // 网站名称（导航栏 logo、页脚、页面标题后缀、SEO）
  name: "Hoang's Security Lab",

  // 默认页面标题（未指定 title 时的后备值）
  defaultTitle: "Hoang's Blog | Cybersecurity & Research",

  // SEO 站点描述（meta description）
  description: 'Offensive Security, HTB Writeups, CVE Analysis, Technical Notes and Daily Thoughts.',

  // ── SEO：分享与链接 ──
  url: 'https://your-github-username.github.io/', // Đổi your-github-username thành username GitHub của bạn
  ogImage: '/og.png',                             // 社交分享预览图（public/og.png，建议 1200×630）
  ogSiteName: 'Hoang Security Lab',               // 分享卡片上显示的站点名

  // 作者信息
  author: {
    name: 'Hoang',
    github: 'your-github-username',               // Điền GitHub username của bạn
    location: 'Hanoi, Vietnam',
  },

  // 关于页面的介绍文字
  about: 'Personal blog focusing on Penetration Testing, HTB Labs, CVE Analysis, Security Research & Daily Life.',

  // 导航栏（href + 显示文字，数组顺序即显示顺序）
  nav: [
    { href: '/blog', label: 'Writeups' },
    { href: '/talk', label: 'Talk' },
    { href: '/archive', label: 'Archive' },
    { href: '/photo', label: 'Photos' },
    { href: '/about', label: 'About' },
  ],
};
