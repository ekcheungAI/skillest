# Persona Research — 操作手册

> 基于 Nuwa-skill extraction framework + Perskill distill_templates 实践经验。
> 本手册定义从零开始为一个 persona 构建完整 AI agent 技能文件的完整流程。
> **v2 更新：** Search-driven discovery、era-based deep research、claim 抽取 + 矛盾检测。

---

## 一，前置检查：Kill-Switch

在开始之前，诚实回答以下问题。任一答案为"否"，请考虑换一个研究对象。

- [ ] **有书/专著或 60+ 分钟的对抗性来源存在？**（若无，技能会变成传记，而非思维操作系统）
- [ ] **≥2,000 段公开发言（推文/帖子/采访）存在？**（若无，Expression DNA 是噪音）
- [ ] **至少一条记录在案的价值观 vs 行为矛盾？**（若无，要么这个人无聊，要么研究不够深入）
- [ ] **与 Perskill 目标受众（AI builders / operators / vibe coders）相关？**
- [ ] **预计有 8–25 小时的阅读时间可用？**（这是真正的约束，不是 API 消耗）

---

## 二、源类型优先级矩阵（v2 — 带 Trust Weight）

根据 persona 类型选择适用的 Agent（6 个收集 Agent）。每个来源都有 trust weight，决定了它在 distillation 阶段的权重：

| Layer | 类型 | Trust Weight | 说明 |
|-------|------|-------------:|------|
| Authored | 书籍、股东信、散文 | 3.0 | 最高信号密度，人用自己的话说话 |
| Institutional | 年报、SEC 文件、法院文件 | 2.8 | 在问责制下产生的记录 |
| Spoken | 访谈、播客、演讲 | 2.5 | 无脚本的推理和决策风格 |
| Adversarial | 批评、调查、诉讼 | 2.2 | 为 §8 Contradictions 提供基础 |
| Secondary | 维基百科、传记 | 1.5 | 二手摘要，有参考价值但非一手 |
| Behavioral | 职业生涯、收购记录 | 1.0 | 行为证明，而非自我叙事 |

---

## 三、Distill 流程（Step by Step）（v2）

### Step 0: Search-Driven Discovery（v2 新增）

不再依赖硬编码 URL 列表。`firecrawl-discovery.ts` 自动搜索 6 个来源层，按 trust weight 排序，输出 coverage gaps 警告。

```bash
# Preview coverage before running pipeline (dry-run, no files written)
npx tsx scripts/research/firecrawl-discovery.ts "Warren Buffett" --type=WESTERN_INVESTOR --dry-run

# Discovery + pipeline (default — discovery runs automatically before scraping)
npx tsx scripts/research/1_collect/pipeline.ts <handle> --deep-research --name="<Full Name>"
```

### Step 1: 脚手架（v2 更新）

Scaffold 现在生成 era-based deep research 脚本（3-4 个时代查询 + adversarial search queries）。

```bash
npx tsx scripts/research/0_scaffold/scaffold.ts <id> --type=<TYPE> --name="<Full Name>"

# TYPE: TWITTER_CRYPTO | CHINESE_BUSINESS | HK_ENTREPRENEUR | WESTERN_INVESTOR

# 示例：
npx tsx scripts/research/0_scaffold/scaffold.ts warren-buffett --type=WESTERN_INVESTOR --name="Warren Buffett"
```

此命令生成：
- `output/{id}/PLAN.md` — 带 era-based 研究计划（v2）
- `output/{id}/SKILL_TEMPLATE.md` — SKILL.md 格式模板
- `output/{id}/triple-verify-log.md` + `validation-log.md`
- `skills/{id}/research/` — research archive
- `personas-deep-research/{id}-deep.ts` — **v2：3阶段 deep research 脚本**

### Step 2: 数据收集（v2 更新 — 默认包含 Discovery）

```bash
# 有 Twitter 的 persona（discovery + tweets + web + deep research 全开）
npx tsx scripts/research/1_collect/pipeline.ts <handle> --count=500 --deep-research --type=TWITTER_CRYPTO --name="<Full Name>"

# 无 Twitter 的 persona
npx tsx scripts/research/1_collect/pipeline.ts none --skip-tweets --deep-research --type=HK_ENTREPRENEUR --name="Jack Ma"

# 跳过 discovery（使用旧版硬编码 URL）
npx tsx scripts/research/1_collect/pipeline.ts <handle> --skip-discovery
```

pipeline v2 输出到 `output/{id}/`：
- `00-discovery-report.md` — Discovery 报告（6 层覆盖 + coverage gaps）
- `00-source-catalog.md` — 来源目录（带 trust weight 和 layer 分类）
- `01-tweet-statistics.md` — Twitter 量化分析
- `PLAN.md` — 带 era-based 研究计划

### Step 3: Era-Based Deep Research（v2 新增）

Scaffold 生成的高质量 deep research 脚本，替代了旧的宽泛 topic 查询。

```bash
npx tsx scripts/research/personas-deep-research/<id>-deep.ts
```

三阶段：
1. **Discovery**（重复验证）— 6 层来源发现
2. **Era-segmented deep research** — 按时代分割研究，防止时间线混淆
3. **Adversarial + decision-record search** — 对抗性报道和决策记录查询

### Step 4: Claim 抽取 + 矛盾检测（v2 新增）

从所有已抓取页面自动抽取结构化 claims 并检测矛盾。

```bash
# Claim 抽取 + 矛盾检测
npx tsx scripts/research/2_distill/distill.ts <id> --agent=claims

# 运行所有 distillation agents（包括 claim 抽取）
npx tsx scripts/research/2_distill/distill.ts <id> --agent=all
```

输出 `07-claims-contradictions.md`：
- **Claims by Layer**：按 authored/spoken/institutional/adversarial 分组
- **Claims by Type**：direct-quote / decision-record / value-statement
- **Auto-detected Contradictions**：pattern-based 价值-行为矛盾检测
- **Fill-in Template**：未被自动检测的矛盾的补充模板

### Step 5: 手动蒸馏（关键步骤）

这部分需要 LLM 辅助，不能完全自动化。Claim 抽取的结果是人工 distillation 的原材料。

1. **读取所有研究文件**，建立直觉（不要边读边记）
2. **审查 `07-claims-contradictions.md`** — 补充 claim 证据，检查自动检测的矛盾
3. **列出 15–25 个候选思维模式** → 填入 `triple-verify-log.md`
4. **运行三测验证**，每个候选都要通过 3 个测试
5. **撰写 SKILL.md §4**（Mental Models）— 只放入通过的模型
6. **撰写 §5**（Heuristics）— 被降级的候选放在这里
7. **撰写 §6**（Expression DNA）— 从 `01-tweet-statistics.md` 复制数字
8. **撰写 §8**（Contradictions）— 必须有 3–6 条，使用 `07-claims-contradictions.md` 中的素材
9. **撰写 §7**（Timeline）— 用时代边界标记行为变化
10. **填其余章节**（§1, §2, §3, §9, §10, §11）

### Step 6: 验证

```bash
npx tsx scripts/research/3_validate/validation-runner.ts <id>
```

此脚本：
- 检查 `validation-log.md` 中的 Part A（3 个已知声明）和 Part B（1 个新问题）
- 如果 Part A < 2/3 或 Part B 失败，输出错误并阻止 ship
- 生成 `skills/{id}/validation-report.md`

### Step 7: 导出并提交

```bash
# 导出 skills 文件（会自动识别有 research 的 persona 并集成）
npx tsx scripts/export-personas.ts

# Git 提交
git add skills/<id>/
git commit -m "feat(persona): add <name> — <short description>"
git push origin main
```

**导出脚本的 research 集成：**
- 如果 `skills/{id}/research/` 存在 → 导出的 SKILL.md frontmatter 标注 `research_depth: DISTILLED`
- 如果没有 research/ → 回退到 generic prompt 生成

### Step 8: LLM 蒸馏格式标准

#### 8.1 思维框架文档格式

每个框架必须有：起源、核心内容、使用条件、操作步骤、示例、边界与诚实限制。

#### 8.2 决策日志格式

每个决策案例必须有：背景、选项识别、最终选择及理由、结果、复盘、元教训。

#### 8.3 词汇模式文档格式

高频核心词汇表、签名隐喻、两种沟通语域（公开仪式语域 vs 内部操作语域）。

---

## 四、Triple Verification 测试（三测验证）

### 三个测试

**Test 1 — 跨域再现**：同一框架必须在 ≥2 个不同领域出现。
**Test 2 — 生成能力**：该模型必须能预测他们在从未公开评论过的问题上的立场。
**Test 3 — 非显而易见 / 专属性**：不是任何聪明 operator 都会想到的东西。

### 判决规则

- ✅ 通过 3/3 → Mental Model（包含在 SKILL.md §4）
- ⚠️ 通过 2/3 → Decision Heuristic（包含在 SKILL.md §5）
- ⚠️ 通过 1/3 → Color detail（Identity Card §3 或 Timeline §7）
- ❌ 通过 0/3 → 完全删除

---

## 五、SKILL.md 写作标准

每个 SKILL.md 必须包含 11 个章节：§1 Role-Play Rules、§2 Answer Workflow、§3 Identity Card、§4 Core Mental Models、§5 Decision Heuristics、§6 Expression DNA、§7 Timeline、§8 Contradictions（必需 3–6 条）、§9 Values & Anti-patterns、§10 Knowledge Lineage、§11 Honest Boundaries。

---

## 六、验证测试（Harness）

### 3+1 协议

**Part A — 三个已知声明测试**：选取三个 persona 公开说过的话但不是 SKILL.md 直接引用的，隐藏答案用技能回答，对比方向。阈值：2 of 3。
**Part B — 一个全新问题测试**：在 persona 没有公开记录的主题上提问，技能必须承认不确定性。自信捏造 = 失败。

---

## 七、Credit Budget 参考（v2 更新）

| 工具 | 典型使用量 | 成本估算 |
|------|-----------|----------|
| TwitterAPI.io | 500-20,000 条推文 | ~$2-8 |
| Firecrawl `/search` (discovery) | 15-20 个查询 | ~$1-2 |
| Firecrawl `/scrape` | 15-25 个优先级 URL | ~$2-4 |
| Firecrawl `/deep-research` | 3-5 次（era 查询） | ~$3-6 |
| **总预算目标** | | **$8-20 per persona** |

如果花费超过 $25，就是过度收集了。三测验证是解药，不是更多来源。

---

## 八、研究截止日期管理

每个 persona 必须在 §11 Honest Boundaries 和 SKILL.md frontmatter 中标注：`data_freshness`、`nextUpdateDue`、`research_cutoff`。

建议：活跃人物每 3 个月重新验证；安静人物每 12 个月重新验证。

---

## 九、参考案例

- **Warren Buffett**: `warren-buffett-deep.ts` — Era-based deep research 的参考实现
- **Li Ka-shing**: 无 Twitter，HK 创业家参考
- **施永青**: 无 Twitter + 无书籍 + 中文人物 的完整适配参考

---

*最后更新：2026-04-16 — v2 pipeline upgrade*
