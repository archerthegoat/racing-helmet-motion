<div align="center">

<p>
  <a href="./README.en.md">English</a> · <strong>简体中文</strong>
</p>

# Racing Helmet Motion

**为真实人像制作有电影感的赛车头盔显影，并把完整方法封装成 Agent Skill**

原色人像 · 自动流动显影 · 局部鼠标水纹 · 克制的人物转向

[![Agent Skill](https://img.shields.io/badge/Agent-Skill-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./SKILL.md)
[![原生 JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./assets/integration/portrait-adapter.js)
[![WebGL](https://img.shields.io/badge/WebGL-Native-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./assets/reference-renderer/portrait-renderer.js)
[![MIT License](https://img.shields.io/badge/License-MIT-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./LICENSE)

[查看在线效果](https://www.archeroy.io/index.html) · [安装](#安装) · [了解实现](#它是怎样工作的) · [阅读 Skill](./SKILL.md)

<a href="https://www.archeroy.io/index.html">
  <img src="docs/media/archer-helmet-motion.webp" width="760" alt="赛车头盔虚影与流动色彩掠过 Archer 的原色人像">
</a>

<sub>截取自 Archer 的线上实现——进入网站并移动鼠标可以看到完整交互</sub>

</div>

---

Racing Helmet Motion 教 Agent 把这项效果做成一组彼此配准、各自独立的图层。人物保持真实可辨，头盔虚影从头顶逐渐显现到面罩与下颌；自动流动无需操作也会继续，鼠标水纹则只在指针附近响应，不会把自动动效顶掉。

## 安装

使用跨 Agent 的 Skills CLI 安装：

```bash
npx skills add archerthegoat/racing-helmet-motion
```

CLI 会发现仓库根目录中的 `SKILL.md`，再让你选择支持的 Agent 与安装范围。运行前需要准备 Node.js 和 npm。

只为 Codex 做用户级安装：

```bash
npx skills add archerthegoat/racing-helmet-motion --agent codex --global
```

<details>
<summary>直接在 Codex 对话中安装</summary>

下面这句话应输入 Codex 对话框，不是在终端运行：

```text
$skill-installer install https://github.com/archerthegoat/racing-helmet-motion
```

这里的 `$skill-installer` 会调用 Codex 内置的安装 Skill。如果安装后没有立刻出现，请重启对应 Agent。

</details>

## 试一试

把人物与头盔素材交给 Agent，然后这样描述：

```text
使用 racing-helmet-motion Skill，为这张人像制作克制的赛车头盔显影。
保留人物原色，先校准头盔再调整动效，并让自动流动和鼠标响应彼此独立。
```

开始前准备三张自己拥有或已获授权的素材：

1. 透明背景的原色人像
2. 透明背景的彩色头盔图，或授权模型的渲染图
3. 与彩色头盔轮廓和视角一致的透明虚影或线框图

## 它是怎样工作的

| 图层 | 表现 |
|---|---|
| **原色人像** | 保留人物肤色、比例与可辨识的真实特征 |
| **头盔虚影** | 从头顶向面罩和下颌显现，并维持微弱的材质流动 |
| **自动显影** | 无需操作也会自行掠过，形状、节奏与衰减持续变化 |
| **鼠标水纹** | 只在指针附近产生小范围响应，不打断自动显影 |
| **人物转向** | 整张人像在克制的范围内轻微跟随，再平滑回到原位 |

渲染器把自动动效、鼠标响应、头盔虚影和人物姿态放在不同时间线上。鼠标开始移动后，画面依然能够保持流动，关键就在这层分离。

## 制作顺序

1. **校准素材**——先用静态合成对齐头顶、面罩、面部开口和下颌
2. **建立头盔虚影**——先做出由上至下的微弱存在感，再加入更明显的流动
3. **分别调整两种显影**——单独调整自动流动与鼠标水纹，最后再检查二者同时出现
4. **接入页面生命周期**——处理静态降级、减少动态、暂停、离屏、页面隐藏与恢复
5. **在真实浏览器里连续检查**——观察空闲、鼠标移动、动效重叠、移出、暂停和恢复

详细规则分别放在[动效契约](./references/effect-contract.md)、[素材配准](./references/asset-registration.md)和[接入与验收](./references/integration-and-qa.md)中。

## 仓库里有什么

```text
racing-helmet-motion/
├── SKILL.md                         Agent 使用说明与完整工作流
├── assets/
│   ├── reference-renderer/          已冻结的参考 WebGL 渲染器
│   └── integration/                 无运行依赖的页面适配器与 CSS
├── references/                      动效、配准与验收说明
├── scripts/verify-reference-kit.mjs 渲染器完整性检查
└── docs/media/                      渲染后的效果演示
```

参考渲染器使用原生 JavaScript 和 WebGL，不依赖第三方运行库。现有配准参数对应仓库参考布局，换用新素材时仍需重新校准。

## 验证

```bash
node scripts/verify-reference-kit.mjs
node --check assets/reference-renderer/portrait-renderer.js
node --check assets/reference-renderer/auto-reveal-field.js
node --check assets/integration/portrait-adapter.js
```

这些检查可以确认源码完整性与 JavaScript 语法。最终动效是否自然，仍需在真实浏览器中连续观察。

## 灵感来源与独立实现

视觉与交互方向受到 [Lando Norris 官方网站](https://landonorris.com/)公开人像体验的启发，主要参考了头盔虚影由上至下出现、显影自行掠过，以及鼠标响应与环境动效彼此独立的关系。

本仓库是重新设计并独立编写的实现，没有复制该网站的源代码、模型、图片或其他媒体，也不代表与 Lando Norris 或其团队存在合作、授权或背书关系。

上方动画来自 [Archer 的个人网站](https://www.archeroy.io/index.html)，展示的是这套方法在真实页面中的效果。仓库发布渲染后的演示、方法、代码与接入示例，不包含 Archer 的人像原图和项目使用的头盔输入素材。

## 素材边界

公开包不提供可复用的人像原图、头盔模型或图片，也不提供提取出的车队和赞助商图案。动态 WebP 是渲染后的效果演示，不是输入素材，也不授予其中内容的复用权。演示中出现的第三方名称、标志和商业外观仍归各自权利人所有。

## 发布者

由 **Archer** 创建并发布 · [@archerthegoat](https://github.com/archerthegoat) · [archeroy.io](https://www.archeroy.io/)

基于 [MIT License](./LICENSE) 发布 · Copyright © 2026 Archer
