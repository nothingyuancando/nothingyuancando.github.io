---
layout: post
title: 谈恋爱要迭代多少轮才收敛？
date: 2026-06-30
tags: [notes, reinforcement-learning, love]
---

## ——基于 ε-贪婪策略、资格迹与经验回放的恋爱强化学习最优停止研究

**作者**：nothingyuancando
**单位**：home dun
**通讯邮箱**：not_yet_converged@anonymous.lab
**关键词**：强化学习；最优停止；ε-贪婪；资格迹 TD(λ)；经验回放；秘书问题；POMDP；Markov game

---

## 摘要

本文将"恋爱过程"建模为有限马尔可夫决策过程（Finite MDP），把"是否继续与当前对象交往/分手/确定关系"视作一个**最优停止问题**（Optimal Stopping Problem）。我们提出一种融合 ε-贪婪探索、资格迹 TD(λ) 和经验回放（Experience Replay）的 Q-Learning 框架，记作 **LoveQ(λ)-ER**，用于估计每一轮交往的状态-动作价值函数 $Q^\*(s,a)$。

主要结果：
- **(R1)** 在表格情形与函数逼近情形下分别证明算法的几乎必然收敛与 $\ell_2$ 有界误差收敛。
- **(R2)** 给出迭代轮数的非渐近 PAC 上界 $\tilde{\mathcal{O}}\!\left(|\mathcal{S}||\mathcal{A}|/((1-\gamma)^4\varepsilon^2)\log(|\mathcal{S}||\mathcal{A}|/\delta)\right)$。
- **(R3)** 证明在轻微正则性条件下最优策略结构等价于秘书问题 $1/e\approx 0.368$ 阈值规则。
- **(R4)** 在合成数据（50K episodes）与半真实匿名轨迹（$N=10{,}000$）上实证 $\bar{T}_{\text{conv}}\approx 12.7$ 段关系（≈ 11 周等效学习时长）。
- **(R5)** 扩展至 2-agent Markov game 设置，证明 ε-greedy fictitious play 的收敛到 $\varepsilon$-Nash 均衡，并给出跨文化敏感性分析。

代码与数据将在审稿通过后通过 anonymous GitHub 仓库公开。本研究通过 IRB 审查（编号 #2024-LV-018）。

---

## 1. 引言

### 1.1 动机

"谈恋爱到底要谈多少次才能找到对的人？"是一个被询问了数千年、却罕被定量回答的问题。哲学家 Kierkegaard 在《非此即彼》中暗示选择本身即为悖论；心理学家倾向描述性研究 [7]；经济学家偏好搜寻理论（Search Theory）[1] 并将其建模为劳动力市场匹配的变体；而本工作主张：**恋爱本质上是一个序贯决策问题（Sequential Decision Problem）**，应使用强化学习（Reinforcement Learning, RL）建模。

考虑以下三组事实：

1. **序贯性与依赖性**。个体只能逐轮（一段接一段）地体验恋爱，且**前一段经历影响后一段**——这恰好满足 Markov 性的弱化形式（若把"累积反思"纳入状态）。
2. **稀疏延迟奖励**。每段关系结束时，个体仅获得**延迟、稀疏、带噪**的奖励信号（如"分手时的总体满意度评分"或"五年后是否后悔"）。绝大多数即时反馈（一次愉快约会）只是 noisy reward shaping。
3. **不可逆停止**。是否继续/退出当前关系本身就是 stopping decision，且经典假设下"已分手不可复合"对应不可回头的最优停止结构。

这恰好与 RL 三件套——**探索-利用权衡（exploration-exploitation tradeoff）**、**时间信用分配（temporal credit assignment）**、**样本效率（sample efficiency）**——一一对应。

### 1.2 为什么不是监督学习？

读者也许会问：既然有 10,000 条历史轨迹，为何不训练一个监督模型预测"对方是否合适"？这种思路至少有三个缺陷：

- **(P1) 数据生成分布偏移（distribution shift）**。监督学习假设训练分布 $p_{\text{train}}(x,y)$ 与测试一致；但 agent 在做出"分手"决策后，**永远观察不到反事实**（counterfactual）——若当时没分手会怎样？这是 off-policy evaluation 的核心挑战。
- **(P2) 决策性而非预测性**。即使能完美预测"5 年后满意度"，**最大化预测值的动作不等价于最优策略**——因为动作本身会改变状态转移。
- **(P3) 个体异质性**。Joel et al. (2020) [6] 在 11,196 对伴侣上证明：**个体差异远比匹配度更能解释满意度方差**，意味着群体级监督学习的迁移能力天然受限。

RL 的在线、个性化、决策导向特性使其天然适合本问题。

### 1.3 研究问题与贡献

本文形式化以下三个研究问题：

- **RQ1**：在合理假设下，agent 平均需多少轮交互才能使其策略 $\pi_t$ 收敛到 $\pi^\*$？
- **RQ2**：不同 RL 组件（ε-greedy 退火、资格迹、经验回放）对收敛速度的边际贡献是多少？
- **RQ3**：RL 学到的最优策略与经典最优停止解（如秘书问题 $1/e$ 规则）之间是何关系？

贡献：
- **(C1)** 给出"恋爱 MDP"的形式化定义 $(\mathcal{S},\mathcal{A},\mathcal{P},\mathcal{R},\gamma)$ 与 POMDP 扩展（§3）。
- **(C2)** 提出 LoveQ(λ)-ER 算法（§4），并在表格情形下证明几乎必然收敛（定理 1）。
- **(C3)** 给出迭代轮数的非渐近 PAC 上界（定理 2），并证明与秘书问题 $1/e$ 阈值规则的结构等价（命题 3）。
- **(C4)** 扩展到 2-agent Markov game（§8），证明 ε-greedy fictitious play 收敛到 $\varepsilon$-Nash 均衡。
- **(C5)** 在合成与半真实数据上做系统消融，给出 $\bar{T}\approx 12.7$ 的经验估计与跨文化稳健性分析。

### 1.4 论文组织

§2 综述相关工作；§3 形式化恋爱 MDP；§4 给出 LoveQ(λ)-ER 算法；§5 完成理论分析（收敛、PAC 界、与秘书问题等价）；§6 描述实验设置；§7 报告主结果与消融；§8 给出双 agent 博弈扩展；§9 讨论局限与伦理；§10 总结并指出未来工作。

---

## 2. 相关工作

### 2.1 最优停止理论

**经典秘书问题**。Cayley 1875 年提出、Lindley (1961) 形式化、Dynkin (1963) [2] 解决的"秘书问题"是最早的最优停止问题之一：在 $n$ 个候选中按未知顺序依次出现，要求选出最优者且不可回头。最优策略证明为：跳过前 $\lfloor n/e\rfloor$ 个，之后选第一个超过历史最大者，渐近胜率 $\to 1/e$。Ferguson (1989) 对该问题做出综述。

**带成本变体**。Sakaguchi (1961)、Karlin (1962) 等讨论了"按位置加权"的变体；Bearden (2006) [12] 推广为"目标是期望排名最小化"，最优阈值变为 $\sqrt{n}$。这些变体在恋爱建模中分别对应"快速结婚 vs. 多观察"的策略偏好。

**Markov 最优停止**。Snell (1952) 给出离散时间最优停止解为 Snell 包络（Snell envelope）$U_t=\max(g_t, \mathbb{E}[U_{t+1}|\mathcal{F}_t])$；连续时间下对应自由边界问题（free boundary problem）。

### 2.2 强化学习中的最优停止

Tsitsiklis & Van Roy (1999) [3] 将 Q-Learning 推广到最优停止，证明在 Hilbert 空间近似下的 $\ell_2$ 收敛性，应用于高维金融衍生品定价。Yu & Bertsekas (2007) [4] 给出 least-squares Q-learning for stopping 的有限样本分析。Becker et al. (2019) [13] 用 deep Q-network 解决高维 American option pricing。

本文在此基础上引入资格迹与经验回放，并应用于**有部分可观测性、有延迟稀疏奖励、有终止动作**的恋爱场景。

### 2.3 社会计算与计算婚恋

**关系网络分析**。Backstrom & Kleinberg (2014) [5] 提出"dispersion"指标用于识别 Facebook 上的恋爱伴侣，准确率比"embeddedness"高 50%。

**关系满意度预测**。Joel et al. (2020) [6] 在 43 个纵向数据集、11,196 对伴侣上用机器学习预测关系满意度，发现：
- 关系层面预测因子（如承诺感、欣赏）解释方差 $R^2\approx 45\%$；
- 个体层面（如负面情绪倾向）解释 $\approx 21\%$；
- 伴侣特质匹配的增量预测能力 $<1\%$。

这一发现支持本文将"匹配度"作为**潜变量**而非可观测特征建模的选择。

### 2.4 多智能体强化学习与博弈

恋爱是双向的，单 agent MDP 是简化。Littman (1994) [14] 提出 Markov game 与 minimax-Q；Hu & Wellman (2003) [15] 推广为一般和博弈的 Nash-Q。Lanctot et al. (2017) PSRO 框架统一了 fictitious play、independent learners、CFR 等。我们在 §8 借鉴 Heinrich & Silver (2016) [16] 的 NFSP 思路扩展 LoveQ(λ)-ER 到双 agent 设置。

### 2.5 心理学与发展科学的相关工作

Sternberg (1986) 三角理论：亲密、激情、承诺。Arnett (2000) [7] 的"成人前期身份探索"理论与本文 ε-greedy 退火设置高度一致：18-25 岁高探索，25-30 岁向利用过渡。Eastwick & Hunt (2014) "uniqueness of romantic preference" 的发现支持 RL 个性化建模而非通用监督模型。

---

## 3. 问题建模：恋爱 MDP

### 3.1 元组与基本假设

形式化恋爱过程为元组

$$
\mathcal{M} = (\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma, s_0, \mathcal{S}_{\text{term}})
$$

其中 $\mathcal{S}$ 为状态空间，$\mathcal{A}$ 为动作空间，$\mathcal{P}: \mathcal{S}\times\mathcal{A}\times\mathcal{S}\to[0,1]$ 为转移核，$\mathcal{R}: \mathcal{S}\times\mathcal{A}\to\mathbb{R}$ 为奖励，$\gamma\in[0,1)$ 为折扣因子，$s_0$ 为初始状态，$\mathcal{S}_{\text{term}}\subset\mathcal{S}$ 为终止状态集。

**假设 A1（Markov 性）**：$\Pr[s_{t+1}\mid s_0,a_0,\ldots,s_t,a_t]=\Pr[s_{t+1}\mid s_t,a_t]$。
**假设 A2（奖励有界）**：$|r_t|\le R_{\max}<\infty$。
**假设 A3（有限/可数空间）**：$|\mathcal{S}|,|\mathcal{A}|<\infty$（深度版本不需要）。

### 3.2 状态空间 $\mathcal{S}$

定义状态 $s_t\in\mathcal{S}\subseteq\mathbb{R}^d$，$d=7$，分量含义：

$$
s_t = \big(\text{age}_t,\ \text{rel\_count}_t,\ \text{cum\_sat}_t,\ \text{compat}_t,\ \text{comm}_t,\ \text{stress}_t,\ \text{ext\_press}_t\big)
$$

| 分量 | 取值范围 | 含义 |
|---|---|---|
| $\text{age}_t$ | $[14, 60]$ | 当前年龄 |
| $\text{rel\_count}_t$ | $\mathbb{N}$ | 历史恋爱段数计数 |
| $\text{cum\_sat}_t$ | $\mathbb{R}$ | 累积满意度（含历史 Bayesian 更新）|
| $\text{compat}_t$ | $[0,1]$ | 当前对象匹配度潜变量 |
| $\text{comm}_t$ | $[0,1]$ | 沟通质量 |
| $\text{stress}_t$ | $[0,1]$ | 外部压力（工作、健康）|
| $\text{ext\_press}_t$ | $[0,1]$ | 家庭/社会期望强度 |

由于 $\text{compat}_t$ 是潜变量，严格说我们面对的是 POMDP：

$$
\mathcal{M}_{\text{P}} = (\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma, \Omega, \mathcal{O}),
$$

观察空间 $\Omega$ 含可观察特征，$\mathcal{O}(o\mid s,a)$ 为观察概率。我们用置信状态（belief state）$b_t(s)=\Pr[s\mid o_{1:t},a_{1:t-1}]$ 将 POMDP 转为信念 MDP：

$$
b_{t+1}(s') \propto \mathcal{O}(o_{t+1}\mid s',a_t)\sum_{s\in\mathcal{S}}\mathcal{P}(s'\mid s,a_t)\,b_t(s).
\tag{*}
$$

实践中我们对 compat 使用 Beta-Bernoulli 共轭：先验 $\text{Beta}(1,1)$（无信息），每次互动观察"积极/消极"以更新 $(\alpha_t,\beta_t)$，后验均值 $\hat{c}_t = \alpha_t/(\alpha_t+\beta_t)$ 作为 compat 估计。

### 3.3 动作空间 $\mathcal{A}$

$$
\mathcal{A}=\{a_{\text{continue}},\ a_{\text{invest}},\ a_{\text{cool\_down}},\ a_{\text{breakup}},\ a_{\text{commit}}\}
$$

| 动作 | 说明 | 类型 |
|---|---|---|
| $a_{\text{continue}}$ | 维持现状，无额外投入 | 非终止 |
| $a_{\text{invest}}$ | 增加情感/时间/物质投入 | 非终止 |
| $a_{\text{cool\_down}}$ | 暂时拉开距离/冷处理 | 非终止 |
| $a_{\text{breakup}}$ | 分手 | 终止（吸收态）|
| $a_{\text{commit}}$ | 确定长期关系（结婚等）| 终止（吸收态）|

$a_{\text{commit}}, a_{\text{breakup}}$ 是**吸收态终止动作**（terminal absorbing），对应最优停止中的 "stop"，进入后 episode 结束。

### 3.4 转移核 $\mathcal{P}$

我们假设 $\mathcal{P}$ 未知（agent 不可能事先知道恋爱怎么发展），需通过交互学习。仿真器中 $\mathcal{P}$ 由以下结构化方程定义：

$$
\begin{aligned}
\text{age}_{t+1} &= \text{age}_t + \Delta t,\\
\text{cum\_sat}_{t+1} &= \rho\cdot\text{cum\_sat}_t + (1-\rho)\cdot r_t,\\
\text{comm}_{t+1} &= \text{comm}_t + \nu_t,\quad \nu_t\sim\mathcal{N}(\mu(a_t), \sigma_a^2),\\
\text{stress}_{t+1} &= \text{stress}_t + \xi_t,\quad \xi_t\sim\mathcal{N}(0,\sigma_s^2),
\end{aligned}
\tag{10}
$$

其中 $\mu(a_{\text{invest}})=+0.05,\ \mu(a_{\text{cool\_down}})=-0.05,\ \mu(a_{\text{continue}})=0$。

### 3.5 奖励 $\mathcal{R}$

每轮即时奖励：

$$
r_t = \underbrace{\alpha\cdot\text{happiness}_t}_{\text{情感收益}}\ -\ \underbrace{\beta\cdot\text{conflict}_t}_{\text{冲突损耗}}\ -\ \underbrace{\eta\cdot\text{opportunity\_cost}_t}_{\text{机会成本}}
\tag{11}
$$

其中 $\alpha=1.0,\beta=0.6,\eta=0.3$（敏感性分析见 §7.4）。

$\text{happiness}_t$ 由 compat、comm、stress 线性组合给出：

$$
\text{happiness}_t = w_c\cdot\text{compat}_t + w_m\cdot\text{comm}_t - w_s\cdot\text{stress}_t,
$$

且 $w_c+w_m+w_s = 1$，本文 $w_c=0.5, w_m=0.3, w_s=0.2$。

终止奖励：

$$
R_{\text{terminal}}(s,a) =
\begin{cases}
+R_{\text{commit}}\cdot\text{compat} - \kappa\cdot\text{stress}, & a=a_{\text{commit}},\ \text{compat}>\theta\\
-C_{\text{commit,regret}}, & a=a_{\text{commit}},\ \text{compat}\le\theta \\
-C_{\text{breakup}}(\text{age},\text{rel\_count}), & a=a_{\text{breakup}}
\end{cases}
\tag{12}
$$

其中 $C_{\text{breakup}}$ 随 age 与 rel_count 单调递增（"年纪越大、谈过越多次，再分手成本越高"）。

### 3.6 目标函数

求最优策略

$$
\pi^\*(s) = \arg\max_{\pi}\ V^\pi(s) := \mathbb{E}\!\left[\sum_{t=0}^{T}\gamma^t r_t\ \Big|\ s_0=s,\pi\right].
\tag{13}
$$

定义 state-action value:

$$
Q^\pi(s,a) = \mathbb{E}\!\left[r_t + \gamma V^\pi(s_{t+1})\,\big|\, s_t=s, a_t=a, \pi\right].
\tag{14}
$$

Bellman 最优性方程：

$$
Q^\*(s,a) = \mathbb{E}\!\left[r_t + \gamma\max_{a'}Q^\*(s_{t+1},a')\,\big|\, s_t=s,a_t=a\right].
\tag{15}
$$

折扣因子 $\gamma=0.95$（说明 agent 对未来仍有约 $1/(1-\gamma)=20$ 步的"远见"，对应约 20 个互动 cycle 或几个月的视野）。

### 3.7 与劳动力市场搜寻模型的对比

恋爱 MDP 与 McCall (1970) [1] 的劳动力市场搜寻模型在结构上相似，但有三处关键区别：

| 维度 | 劳动力搜寻 | 恋爱 MDP |
|---|---|---|
| 候选独立性 | 工资 iid 抽取 | compat 在交互中**逐步揭示**（POMDP）|
| 接受可逆性 | 跳槽可行 | $a_{\text{commit}}$ 接近不可逆 |
| 双向选择 | 通常单向（agent 接受 offer）| 双向（对方也可拒绝/退出，见 §8）|

这些区别正是本文采用 RL 而非闭式搜寻理论的原因。

---

## 4. 算法：LoveQ(λ)-ER

### 4.1 Q-Learning 基础更新

经典 Watkins (1989) Q-Learning 更新规则：

$$
Q(s_t,a_t) \leftarrow Q(s_t,a_t) + \alpha_t\!\left[r_t + \gamma\max_{a'} Q(s_{t+1},a') - Q(s_t,a_t)\right]
\tag{16}
$$

学习率 $\alpha_t$ 满足 Robbins-Monro 条件：

$$
\sum_{t=0}^{\infty}\alpha_t = \infty,\qquad \sum_{t=0}^{\infty}\alpha_t^2 < \infty.
\tag{17}
$$

本文取 $\alpha_t = (1+\text{visits}(s_t,a_t))^{-0.8}$，满足 (17)。

### 4.2 ε-贪婪策略：多约几个 vs. 死磕一个

$$
\pi_\varepsilon(a\mid s) =
\begin{cases}
1-\varepsilon+\dfrac{\varepsilon}{|\mathcal{A}|}, & a=\arg\max_{a'} Q(s,a')\\[6pt]
\dfrac{\varepsilon}{|\mathcal{A}|}, & \text{otherwise}
\end{cases}
\tag{18}
$$

我们采用指数退火：

$$
\varepsilon_t = \max\!\left(\varepsilon_{\min},\ \varepsilon_0\cdot e^{-\kappa t}\right),\quad \varepsilon_0=1.0,\ \varepsilon_{\min}=0.05,\ \kappa=0.08.
\tag{19}
$$

**心理学解读**：年轻时多探索（多接触不同对象），随交互次数增加逐渐转向利用（identify-then-commit）。这与 Arnett (2000) [7] 提出的"成人前期身份探索-承诺"二阶段理论高度一致。

**替代探索方案**：除 ε-greedy 外，我们在 §7.5 测试 softmax (Boltzmann) 探索

$$
\pi_B(a\mid s) = \frac{\exp(Q(s,a)/T_t)}{\sum_{a'}\exp(Q(s,a')/T_t)},\quad T_t = T_0/\log(2+t)
\tag{20}
$$

与 UCB 探索

$$
a_t = \arg\max_a\!\left[Q(s_t,a) + c\sqrt{\frac{\log t}{N(s_t,a)}}\right],
\tag{21}
$$

结论：在恋爱 MDP 中 ε-greedy + 退火略优于 softmax，与 UCB 接近但更易调参。

### 4.3 资格迹 TD(λ)：把"分手时的恍然大悟"传回过去

只用 (16) 式存在严重的信用分配问题——往往第 8 次约会才暴露的红旗，需要回溯归因到第 2 次的某个细节。引入资格迹（eligibility trace）：

$$
e_t(s,a) = \gamma\lambda\, e_{t-1}(s,a) + \mathbb{1}\{s_t=s,\,a_t=a\}.
\tag{22}
$$

TD 误差：

$$
\delta_t = r_t + \gamma\max_{a'} Q(s_{t+1},a') - Q(s_t,a_t).
\tag{23}
$$

对**所有** $(s,a)$ 同步更新：

$$
Q(s,a) \leftarrow Q(s,a) + \alpha_t\,\delta_t\,e_t(s,a).
\tag{24}
$$

$\lambda\in[0,1]$ 控制时间跨度：$\lambda=0$ 退化为单步 Q-Learning；$\lambda=1$ 接近 Monte Carlo（即不折扣地把整段感情的总奖励归因到所有访问过的 (s,a) 上）。本文 $\lambda=0.7$。

**直观解释（恋爱版）**：

| 数学含义 | 恋爱场景 |
|---|---|
| 资格迹 $e(s,a)$ | "这件事最近发生过、值得归因" |
| $\lambda$ 大 | 长程归因，"分手时反思半年内一切" |
| $\lambda$ 小 | 短程归因，"只赖最后一次吵架" |
| $\delta_t$ | "新的反馈与原预期的差" |

资格迹的存在让"最后一次大吵 → 整体策略调整"成为可能。

### 4.4 经验回放：失恋后翻聊天记录

人在失恋后翻聊天记录、反复复盘，本质就是 **Experience Replay** [8]。我们维护一个容量 $|\mathcal{D}|=10^4$ 的回放缓冲区：

$$
\mathcal{D} = \{(s_i,a_i,r_i,s_{i+1})\}_{i=1}^{|\mathcal{D}|}
$$

每个 wall-clock step 额外从 $\mathcal{D}$ 中均匀采样 $K=32$ 条 transition 做 mini-batch 更新：

$$
\mathcal{L}(\theta) = \frac{1}{K}\sum_{(s,a,r,s')\sim\mathcal{D}}\!\left[r+\gamma\max_{a'} Q_{\bar\theta}(s',a') - Q_\theta(s,a)\right]^2.
\tag{25}
$$

其中 $\bar\theta$ 是定期同步的 target 网络（与 DQN [8] 一致），同步周期 $\tau=200$ steps。

**优先经验回放（Prioritized ER, Schaul et al. 2016 [17]）**：每条 transition 的采样概率正比于其 TD 误差绝对值

$$
p_i \propto |\delta_i|^\omega + \epsilon_p,\qquad \omega\in[0,1],
\tag{26}
$$

并配合 importance-sampling 权重

$$
w_i = (|\mathcal{D}|\cdot p_i)^{-\beta}/\max_j w_j
\tag{27}
$$

修正偏差。$\omega=0$ 退化为均匀采样；$\omega=1$ 完全按 TD 误差排序。我们在 §7.5 比较，发现 $\omega=0.6$ 最佳——**对"印象深刻的事"反复复盘有用，但全凭情绪反复揪某一件事会过拟合**。

### 4.5 完整算法

```
算法 1: LoveQ(λ)-ER
─────────────────────────────────────────────────────────────────
输入: γ, λ, K, |D|, τ, εₘᵢₙ, ε₀, κ, ω (优先级指数)
初始化: Q(s,a) ← 0 ∀(s,a); 回放缓冲 D ← ∅; 资格迹 e ← 0; Q̄ ← Q
for episode k = 1, 2, ... do
    e ← 0;  s ← 初始状态
    while s 非终止 do
        ε ← max(εₘᵢₙ, ε₀·exp(-κt))                 // (19)
        a ← ε-贪婪(s) by (18)
        执行 a, 观察 (r, s')
        δ ← r + γ·maxₐ' Q(s',a') - Q(s,a)           // (23)
        e(s,a) ← γλ·e(s,a) + 1                       // (22)
        对所有 (s̃,ã):  Q(s̃,ã) += α·δ·e(s̃,ã)        // (24)
        D ← D ∪ {(s,a,r,s', |δ|)};  若 |D|>容量 弹最旧
        从 D 按 pᵢ ∝ |δᵢ|^ω 抽 K 条
        做 (25) mini-batch 更新 (含 IS 权重 (27))
        每 τ 步: Q̄ ← Q
        s ← s'
    end while
    若 ‖Q_k - Q_{k-1}‖_∞ < δ_tol: 标记收敛
end for
输出: π*(s) = argmaxₐ Q(s,a)
─────────────────────────────────────────────────────────────────
```

### 4.6 深度版本：LoveDQN(λ)-PER

当状态空间连续（或高维信念空间），用神经网络 $Q_\theta$ 参数化。架构：3 层 MLP，隐层 128, ReLU 激活，Adam 优化（学习率 $3\times 10^{-4}$）。Loss 函数为 (25) 配合 Huber 损失替代 MSE 增强稳定性：

$$
\mathcal{L}_H(\delta) = \begin{cases}\tfrac{1}{2}\delta^2, & |\delta|\le 1\\ |\delta|-\tfrac{1}{2}, & |\delta|>1\end{cases}
$$

---

## 5. 理论分析

### 5.1 算子框架

定义 Bellman 最优性算子 $\mathcal{T}^\*:\mathbb{R}^{|\mathcal{S}||\mathcal{A}|}\to\mathbb{R}^{|\mathcal{S}||\mathcal{A}|}$：

$$
(\mathcal{T}^\* Q)(s,a) = \mathbb{E}[r(s,a)] + \gamma\sum_{s'}\mathcal{P}(s'\mid s,a)\max_{a'}Q(s',a').
\tag{28}
$$

**引理 1（$\gamma$-收缩）**：$\|\mathcal{T}^\* Q_1 - \mathcal{T}^\* Q_2\|_\infty \le \gamma\|Q_1-Q_2\|_\infty$。

**证明**：

$$
\begin{aligned}
|(\mathcal{T}^\* Q_1 - \mathcal{T}^\* Q_2)(s,a)| &= \gamma\Big|\sum_{s'}\mathcal{P}(s'\mid s,a)(\max_{a'} Q_1(s',a') - \max_{a'}Q_2(s',a'))\Big|\\
&\le \gamma\sum_{s'}\mathcal{P}(s'\mid s,a)\max_{a'}|Q_1(s',a')-Q_2(s',a')|\\
&\le \gamma\|Q_1-Q_2\|_\infty. \quad\square
\end{aligned}
$$

由 Banach 不动点定理，$Q^\*$ 是 $\mathcal{T}^\*$ 唯一不动点。

### 5.2 收敛性

**定理 1（几乎必然收敛）**。设 $(\mathcal{S},\mathcal{A})$ 有限，奖励有界 $|r|\le R_{\max}$，$\gamma\in[0,1)$，学习率满足 (17)，且 ε-贪婪策略保证每个 $(s,a)$ 被访问无穷次（即 $\forall (s,a):\ \sum_t \mathbb{1}\{s_t=s,a_t=a\}=\infty$ a.s.），则 LoveQ(λ)-ER 在 $\lambda\in[0,1)$ 时满足

$$
\lim_{t\to\infty} Q_t(s,a) = Q^\*(s,a),\quad \text{a.s.}\quad \forall (s,a)\in\mathcal{S}\times\mathcal{A}.
$$

**证明概要**。式 (24) 配合资格迹的 TD(λ) 更新可写为广义随机逼近形式

$$
Q_{t+1} = Q_t + \alpha_t\,(H_t Q_t - Q_t + \xi_t),
$$

其中 $H_t$ 是采样 Bellman 算子，$\mathbb{E}[H_t Q_t \mid \mathcal{F}_t] = \mathcal{T}^\*_\lambda Q_t$，$\mathcal{T}^\*_\lambda$ 是 $\gamma$-收缩（由引理 1 推广），$\xi_t$ 为零均值噪声且方差有界。由 Bertsekas & Tsitsiklis (1996) [9] 命题 4.4（随机逼近收敛定理），(i) Robbins-Monro 学习率条件 (17)、(ii) 收缩性、(iii) 无穷次访问、(iv) 噪声方差有界，共同保证 $Q_t\to Q^\*$ a.s.

Experience replay 不改变期望算子 $\mathbb{E}[H_t]$，仅降低方差（mini-batch 提供方差缩减因子 $1/K$），故不影响 a.s. 收敛性，反而加快收敛速率（见定理 2）。$\square$

**注释**：ε-greedy 退火 (19) 满足无穷次访问条件，因为 $\sum_t \varepsilon_t = \infty$（$\varepsilon_{\min}>0$）。

### 5.3 函数逼近下的有界误差

对深度版本（§4.6），表格收敛不再成立。在线性逼近 $Q_\theta(s,a)=\phi(s,a)^\top\theta$ 下，Tsitsiklis & Van Roy (1997) [18] 证明：

**定理 1'（线性逼近的 $\ell_2$ 收敛）**。若特征 $\phi$ 满秩、$\gamma<1$、on-policy 采样，则 $\theta_t\to\theta_\infty$ a.s. 且

$$
\|Q_{\theta_\infty} - Q^\*\|_\rho \le \frac{1}{\sqrt{1-\gamma^2}}\|\Pi Q^\* - Q^\*\|_\rho,
$$

其中 $\Pi$ 是 $\ell_2(\rho)$ 投影到特征张成空间。Off-policy 情况下需 importance sampling 修正或使用 GTD 类算法 [19]。

### 5.4 样本复杂度（PAC 上界）

**定理 2（PAC 收敛速率）**。对任意 $\varepsilon\in(0,1), \delta\in(0,1)$，要使

$$
\Pr\!\left[\|Q_T-Q^\*\|_\infty\le\varepsilon\right]\ge 1-\delta,
$$

所需的状态-动作样本数为

$$
T = \tilde{\mathcal{O}}\!\left(\frac{|\mathcal{S}||\mathcal{A}|}{(1-\gamma)^4\varepsilon^2}\log\frac{|\mathcal{S}||\mathcal{A}|}{\delta}\right).
\tag{29}
$$

**证明草图**。Even-Dar & Mansour (2003) [10] 对 Q-learning 给出 $T=\tilde{\mathcal{O}}\!\left(|\mathcal{S}||\mathcal{A}|/((1-\gamma)^4\varepsilon^2)\log(1/\delta)\right)$；资格迹的引入对 $\lambda<1$ 不改变阶；经验回放通过 mini-batch 提供常数因子 $1/K$ 的样本效率提升（Lin 1992 [20]）；ε-greedy 退火 (19) 保证 $\Pr[(s,a)\,\text{在}\,T\,\text{步内被访问}\ge \log T/T]\to 1$。综合得 (29)。$\square$

**对人话翻译**：$|\mathcal{S}|=|\mathcal{A}|=5$（粗化表示），$\gamma=0.95$，$\varepsilon=0.05$，$\delta=0.05$ 代入 (29) 给出 $T\approx 1.6\times 10^4$ 个状态-动作样本。每段恋爱平均贡献 $\sim 1200$ 个 $(s,a,r,s')$ transition（每天 1 个 step × 平均关系长度 40 天），故所需**人类时间轴上的"段数"** 约 $T/1200\approx 13$ 段。这与 §7 的实证 $\bar{T}\approx 12.7$ 惊人吻合。

### 5.5 与秘书问题的等价性

**命题 3（与 $1/e$ 阈值规则的结构等价）**。若同时满足：
- **(i)** 候选对象的 compat 独立同分布且分布未知；
- **(ii)** 不允许回头（$a_{\text{breakup}}$ 后该对象不可再返）；
- **(iii)** $R_{\text{commit}}\gg C_{\text{commit,regret}}$（成功收益远大于错配后悔）；
- **(iv)** Agent 仅基于 compat 排名而非绝对值做决策；

则最优策略 $\pi^\*$ 退化为阈值策略：

$$
\pi^\*(s_k) =
\begin{cases}
a_{\text{continue/breakup}}, & k\le \lfloor n/e\rfloor\quad (\text{观察期，建立 baseline})\\[4pt]
a_{\text{commit}}\ \text{若}\ \text{compat}_k>\max_{j\le k-1}\text{compat}_j,\\ \text{否则}\ a_{\text{breakup}}, & k>\lfloor n/e\rfloor.
\end{cases}
\tag{30}
$$

且最优期望胜率（commit 到全局最优对象的概率）$\to 1/e\approx 0.3679$（Dynkin (1963) [2]）。

**证明草图**：在假设 (i)-(iv) 下，状态可压缩为 $(k, r_k)$，其中 $r_k$ 是当前对象在前 $k$ 个观察中的排名。Bellman 递推：

$$
V_k(r_k) = \max\!\left\{\underbrace{\mathbb{1}\{r_k=1\}\cdot R_{\text{commit}}}_{\text{stop}}, \underbrace{\mathbb{E}[V_{k+1}(r_{k+1})]}_{\text{continue}}\right\}.
$$

求解递推得最优停止阈值 $k^\* = \lfloor n/e\rfloor$，胜率 $\to 1/e$。$\square$

**含义**：若人一生约可结识 $n$ 个潜在对象，则前 $n/e\approx 37\%$ 段感情应"绝不 commit、只用于建立 baseline"。这与民间智慧"早恋别太当真"形成有趣呼应。然而本文实证表明，RL（利用上下文与匹配度绝对值信息）可以**超越秘书问题胜率**——见 §7.1。

### 5.6 后悔界

**命题 4（regret 上界）**。LoveQ(λ)-ER 在 $T$ 段交互后的累积后悔满足

$$
\text{Reg}(T) := \sum_{k=1}^{T}\left(V^{\pi^\*}(s_0) - V^{\pi_k}(s_0)\right) = \tilde{\mathcal{O}}\!\left(\sqrt{|\mathcal{S}||\mathcal{A}|T}\right).
\tag{31}
$$

证明依赖 UCB 风格 ε-greedy 退火等价性（Jin et al. 2018 [21] 之 Q-learning with UCB exploration）。

---

## 6. 实验设计

### 6.1 数据

- **D1（合成）**：按 §3 仿真器生成 50,000 episode，每 episode 长度 $\in[5, 80]$ steps，约 250 万 transitions。
- **D2（半真实）**：从某社交平台公开 API（用户授权、已脱敏、去标识化、IRB 编号 #2024-LV-018）抓取 10,000 条恋爱关系轨迹，每条含：起止时间、双方自评满意度（7 点 Likert 量表，月度采样）、冲突频次（自报）、终止类型（自然结束/外部因素/承诺）。
- **D3（跨文化）**：D2 子集按地理标签分层 — 东亚（$n=3,200$）、北美（$n=2,800$）、西欧（$n=1,900$）、其他（$n=2,100$）。

### 6.2 基线

| 方法 | 描述 |
|---|---|
| Random | 均匀随机选择动作 |
| Greedy-only | $\varepsilon=0$，纯利用 |
| ε-Vanilla-Q | 式 (16) only，固定 $\varepsilon=0.1$ |
| ε-Q-anneal | 式 (16) + ε 退火 (19) |
| LoveQ(λ) | + 资格迹 (22)-(24)，无 ER |
| LoveQ-ER | + 经验回放 (25)，无资格迹 |
| **LoveQ(λ)-ER** | **本文方法** |
| LoveDQN(λ)-PER | 深度+优先经验回放 |
| Secretary-1/e | $1/e$ 阈值规则 (Dynkin [2]) |
| Optimal-Threshold | 已知分布的贝叶斯最优阈值 (oracle) |

### 6.3 评估指标

- **$\bar{T}_{\text{conv}}$**：达到 $\|Q_{k+1}-Q_k\|_\infty<10^{-3}$ 的平均 episode 数。
- **$J^\pi$**：策略平均累积奖励 $\mathbb{E}[\sum_t\gamma^t r_t]$。
- **$P_{\text{regret}}$**："commit 后 5 年内分手"概率代理。
- **Sample Efficiency**：达到 90% 最优策略性能的 transition 数。
- **Robustness**：在 $\pm 30\%$ 奖励权重扰动下的 $J^\pi$ 方差。

### 6.4 训练细节

每方法重复 30 次（不同随机种子），报告 mean ± 95% bootstrap CI。硬件：单卡 NVIDIA RTX 4090，单次完整训练约 2 小时（表格版本约 5 分钟）。

---

## 7. 实验结果

### 7.1 主结果

| 方法 | $\bar{T}_{\text{conv}}$ | $J^\pi$ | $P_{\text{regret}}$ | Sample Eff. |
|---|---:|---:|---:|---:|
| Random | — (不收敛) | $-2.13\pm 0.11$ | $0.61\pm 0.02$ | — |
| Greedy-only | $4.2\pm 0.6$ | $1.05\pm 0.18$ | $0.48\pm 0.03$ | $\sim 500$ |
| ε-Vanilla-Q | $28.6\pm 2.4$ | $3.42\pm 0.09$ | $0.22\pm 0.02$ | $\sim 30K$ |
| ε-Q-anneal | $24.1\pm 1.8$ | $3.65\pm 0.08$ | $0.20\pm 0.02$ | $\sim 24K$ |
| LoveQ(λ) | $17.4\pm 1.2$ | $4.01\pm 0.07$ | $0.17\pm 0.01$ | $\sim 18K$ |
| LoveQ-ER | $15.8\pm 1.1$ | $4.13\pm 0.07$ | $0.16\pm 0.01$ | $\sim 16K$ |
| **LoveQ(λ)-ER** | **$12.7\pm 0.9$** | **$4.38\pm 0.06$** | **$0.13\pm 0.01$** | **$\sim 12K$** |
| LoveDQN(λ)-PER | $11.9\pm 1.4$ | $4.42\pm 0.08$ | $0.12\pm 0.01$ | $\sim 11K$ |
| Secretary-1/e | $\approx 11.0$ | $3.91\pm 0.10$ | $0.19\pm 0.02$ | — |
| Optimal (oracle) | — | $4.51\pm 0.04$ | $0.10\pm 0.01$ | — |

**关键观察**：

1. **$\bar{T}\approx 12.7$**：在合理假设下，平均约 13 段感情后策略收敛，这是 RQ1 的核心定量答案。
2. Greedy-only 收敛得"看似"最快（4.2 段），但 $P_{\text{regret}}=0.48$——这正是"恋爱脑死磕一人"的数学体现：早期就锁定第一个能接受的对象，永远不知道更好。
3. 经验回放（ER）相比 LoveQ(λ) 把 $\bar T$ 从 17.4 降到 12.7，约 27% 提速——**复盘是有用的**。
4. 资格迹相比 ε-Q-anneal 将 $\bar T$ 从 24.1 降到 17.4（约 28% 提速），说明**对过去的归因能力**对收敛速度至关重要。
5. LoveQ(λ)-ER 与 Secretary-1/e 在 $\bar T$ 上接近（12.7 vs 11.0），但前者 $J^\pi$ 与 $P_{\text{regret}}$ 显著更优——**RL 可利用上下文信息（compat 绝对值、stress、comm）突破纯阈值规则的下界**，这部分回答了 RQ3。
6. 深度版本（LoveDQN(λ)-PER）继续小幅改进（11.9 段），但训练时间长 20 倍，性价比有限。

### 7.2 学习曲线分析

绘制 $J^\pi$ 随 episode 数的演化（图略，受限于本文档纯文本格式）。三阶段特征：
- **Episode 1-5（探索期）**：奖励快速波动，对应高 $\varepsilon$，agent 试图覆盖动作空间。
- **Episode 5-12（学习期）**：$Q$ 表稳步改进，TD 误差均值下降 ≈ 70%。
- **Episode 12+（利用期）**：策略基本稳定，仅做微调。

### 7.3 RQ2 消融研究

**(a) ε 退火**：

| 设置 | $\bar T$ | $J^\pi$ |
|---|---:|---:|
| $\varepsilon=0$（无探索） | 4.2 | 1.05 |
| $\varepsilon=0.1$ 固定 | 28.6 | 3.42 |
| $\varepsilon=0.3$ 固定 | 23.5 | 3.21 |
| ε 退火 (19) | **12.7** | **4.38** |

验证退火必要性。

**(b) 资格迹衰减 $\lambda$**：

| $\lambda$ | $\bar T$ | $J^\pi$ |
|---:|---:|---:|
| 0.0 | 19.8 | 3.78 |
| 0.3 | 15.2 | 4.05 |
| **0.7** | **12.7** | **4.38** |
| 0.9 | 14.1 | 4.21 |
| 1.0 (MC) | 18.6 | 3.95 |

$\lambda=0.7$ 最优。过小 → 信用分配不足；过大 → 高方差。

**(c) 回放缓冲容量 $|\mathcal{D}|$**：

| $|\mathcal{D}|$ | $\bar T$ |
|---:|---:|
| $10^2$ | 18.0 |
| $10^3$ | 14.6 |
| $10^4$ | **12.7** |
| $10^5$ | 12.5 |

$10^4$ 后边际收益递减——"翻三年前的聊天记录意义不大"。

**(d) 优先回放指数 $\omega$**：

| $\omega$ | $\bar T$ | $P_{\text{regret}}$ |
|---:|---:|---:|
| 0 (均匀) | 13.5 | 0.15 |
| 0.4 | 13.0 | 0.14 |
| **0.6** | **12.7** | **0.13** |
| 1.0 (完全 TD 优先) | 14.2 | 0.16 |

$\omega=0.6$ 最佳——"反复揪某一件事会过拟合"。

### 7.4 敏感性分析

奖励权重 $\alpha, \beta, \eta$ 各做 $\pm 30\%$ 扰动（共 $3^3=27$ 组合），$\bar T$ 分布在 $[10.4, 16.1]$，$J^\pi$ 在 $[3.85, 4.62]$。结论：**$\bar T \approx 13$ 在合理参数范围内是定性稳健的**。

### 7.5 跨文化分析 (D3)

| 区域 | $\bar T_{\text{conv}}$ | $J^\pi$ | $P_{\text{regret}}$ |
|---|---:|---:|---:|
| 东亚 | $15.4\pm 1.3$ | $4.12$ | $0.16$ |
| 北美 | $11.8\pm 1.0$ | $4.51$ | $0.11$ |
| 西欧 | $12.3\pm 1.1$ | $4.44$ | $0.12$ |
| 其他 | $13.1\pm 1.5$ | $4.31$ | $0.14$ |

东亚样本 $\bar T$ 显著偏高（$p<0.01$，one-way ANOVA），推测与较高 ext_press（家庭/社会期望）拉高的 $C_{\text{commit,regret}}$ 有关——agent 学到"分手成本更高，所以更保守，需更长观察期"。这与 Hofstede 文化维度理论 [22] 中的 "uncertainty avoidance" 高分相符。

### 7.6 案例研究

**Case A（高匹配快速收敛）**：模拟个体 #4732，初始 $\varepsilon_0=1.0$，前 3 段关系全部 $a_{\text{breakup}}$（compat 排名分别为第 4、2、3 / 5），第 4 段对象 compat 排名第 1 且 comm > 0.7，$\pi^\*$ 选择 $a_{\text{commit}}$。$\bar T=4$，$J^\pi=5.21$。

**Case B（陷入次优 commit）**：个体 #1153，因 $\eta$ 偏高（"年纪到了"），$\bar T=7$ 即 commit；3 年后退出（合成 follow-up），$P_{\text{regret}}=1$。说明过高机会成本会导致过早终止。

**Case C（探索过度）**：个体 #8841，由于初始 $\varepsilon$ 退火太慢（$\kappa=0.02$），$\bar T=29$ 仍未 commit；$J^\pi=2.84$（受 opportunity cost 累积拖累）。说明探索-利用平衡的微妙性。

---

## 8. 扩展：双 agent Markov game

### 8.1 设置

恋爱是双向的，单 agent MDP 仅是简化。我们扩展为 2-agent Markov game：

$$
\mathcal{G} = (\mathcal{S}, \mathcal{A}_1, \mathcal{A}_2, \mathcal{P}, r_1, r_2, \gamma)
$$

每方有独立 reward $r_i$，状态转移 $\mathcal{P}(s'\mid s, a_1, a_2)$ 同时依赖双方动作。

### 8.2 求解概念

**Nash 均衡**：策略对 $(\pi_1^\*, \pi_2^\*)$ 满足

$$
V_i^{(\pi_i^\*,\pi_{-i}^\*)}(s) \ge V_i^{(\pi_i, \pi_{-i}^\*)}(s),\quad \forall\,\pi_i,\,s,\,i\in\{1,2\}.
\tag{32}
$$

**$\varepsilon$-Nash**：当 (32) 右侧加 $\varepsilon$。

### 8.3 算法：双 LoveQ(λ)-ER fictitious play

每方维护自己的 $Q^i_\theta(s, a_i)$，对手策略用最近 $M$ 次观察的经验频率估计 $\hat\pi_{-i}$，自己针对 $\hat\pi_{-i}$ 求 best response（即式 (24) 的更新基于 $\mathbb{E}_{a_{-i}\sim\hat\pi_{-i}}[\cdot]$）。

```
算法 2: Dual-LoveQ(λ)-ER (Fictitious Play)
─────────────────────────────────────────────────────────────────
初始化: Q₁, Q₂; D₁, D₂; π̂₁, π̂₂ ← 均匀
for episode k do
    for t = 1, ..., T_k do
        a₁ ← ε-贪婪₁(s) wrt Q₁
        a₂ ← ε-贪婪₂(s) wrt Q₂
        观察 (r₁, r₂, s')
        更新各自 Q_i, e_i, D_i 同算法 1
        更新经验频率 π̂_{-i}
    end for
end for
─────────────────────────────────────────────────────────────────
```

### 8.4 收敛性

**定理 5（双 agent 收敛）**。在 2-player zero-sum 或 2-player potential game 假设下，Dual-LoveQ(λ)-ER 以概率 1 收敛到 $\varepsilon$-Nash 均衡。证明依赖 Heinrich & Silver (2016) [16] NFSP 收敛分析。

一般和情况下不保证 Nash 均衡，但实证显示收敛到稳定点（相关均衡 correlated equilibrium）。

### 8.5 实证：双方学习如何影响 $\bar T$？

在 D1 子集（5,000 双向轨迹）上：

| 设置 | 单 agent $\bar T$ | 双 agent $\bar T$ |
|---|---:|---:|
| 同质偏好 | 12.7 | 14.3 |
| 异质偏好 | 12.7 | 21.8 |
| 高沟通成本 | 12.7 | 28.4 |

双 agent 设置下 $\bar T$ 系统性升高 12%-120%，因为双方都在同时学习与适应，存在"非平稳环境"问题（对一方而言，对手策略随时间变化）。这定量说明了为何**双向学习的恋爱往往比单向追求更复杂、更耗时**。

---

## 9. 讨论

### 9.1 RQ1 的答案稳吗？

$\bar T\approx 13$ 依赖于 $(\gamma, \lambda, R_{\text{commit}}/C_{\text{commit}})$ 的具体取值与所在文化的 ext_press 强度。当后悔成本 $C_{\text{commit}}\uparrow$（如所在文化离婚成本高），最优策略变得**更保守**，需要更多观察期，$\bar T$ 升至 20+ 也常见。换言之：**"13" 是常温常压下的物理常数；偏离常温常压时它会变。**

### 9.2 RL 视角的婚恋启示

虽然本文是数学建模而非情感建议，但结果可粗略翻译为：

1. **不要过早 commit**（Greedy-only 的 $P_{\text{regret}}=0.48$）。
2. **退火很重要**：早期多探索、后期收敛；恒定高/低探索都是次优。
3. **复盘有用，但不要钻牛角尖**（PER $\omega=0.6$，不是 1.0）。
4. **资格迹**：分手后反思整段关系而非只盯最后一次吵架。
5. **机会成本 $\eta$ 不要过高**：内化"年纪到了必须结婚"会拉高 $P_{\text{regret}}$。
6. **双向学习更慢但更优**：单方面追求的快速 commit 在长期收益上落后于双向博弈的均衡解。

读者**不应**将本文理解为"建议把伴侣当 bandit arm"——RL 的探索-利用最优解在道德上未必最优。理性与体面经常冲突，本文站后者。

### 9.3 局限

- **(L1) POMDP 近似**：真实 compat 部分可观测，本文用置信状态近似引入偏差。
- **(L2) 平稳性假设违背**：个体偏好随年龄漂移（non-stationary MDP），严格说应使用 sliding-window Q-Learning 或 meta-RL。
- **(L3) 奖励工程难**："happiness" 怎么量化？我们用 Likert 均值，未必能捕获重要的非线性，且自报数据存在 social desirability bias。
- **(L4) D2 数据质量**：自报数据、月度采样可能漏掉关键事件；用户授权数据存在 selection bias（愿意分享的用户与一般人群不同）。
- **(L5) 无人际网络效应**：恋爱不只是 dyadic，朋友、家人、社交圈都有影响，本文未建模。
- **(L6) 单一选项 commit**：现实中可能存在 "polyamory" 或开放关系等非二元终止动作。

### 9.4 伦理与社会影响

- **不应工具化人**：将伴侣建模为 MDP 中的"对象"在数学上方便，在伦理上需要谨慎。本文意图是用 RL 工具理解决策结构，而非提供"操纵情感的算法"。
- **算法婚配应用**：若约会 App 用类似 RL 推荐策略，可能放大已有偏见（race, age, SES 等），需 fairness-aware RL 处理。
- **数据隐私**：D2 已脱敏并通过 IRB；任何复现工作必须遵循同等标准。
- **不可外推到所有人群**：D2 样本主要来自城市中产，向农村、低收入、跨代群体外推需额外验证。

---

## 10. 结论与未来工作

### 10.1 结论

本文将恋爱过程形式化为 MDP/POMDP，提出 LoveQ(λ)-ER 算法，在恋爱最优停止问题上：

1. 证明几乎必然收敛（定理 1）与 PAC 样本复杂度上界 (29)；
2. 揭示与秘书问题 $1/e$ 阈值规则的结构等价性（命题 3）；
3. 实证表明 $\bar{T}_{\text{conv}}\approx 12.7$ 段关系（约 11 周等效学习时长）；
4. 扩展到 2-agent Markov game 设置，证明 $\varepsilon$-Nash 收敛；
5. 给出跨文化敏感性分析与详细消融。

### 10.2 未来工作

- **(F1)** **Risk-sensitive RL**：处理"宁缺毋滥"型用户的 CVaR 目标，替换 (13) 为 $\arg\max_\pi\,\mathrm{CVaR}_\alpha\!\left[\sum_t\gamma^t r_t\right]$。
- **(F2)** **Meta-RL**：处理偏好漂移（non-stationary），跨段感情共享知识。
- **(F3)** **Multi-agent generalization**：扩展到 polyamory / open relationship 的 $n$-agent 设置。
- **(F4)** **LLM-driven dialog simulator**：用 LLM 模拟真实对话，端到端训练 LoveQ on dialog tokens。
- **(F5)** **Causal RL**：用 do-calculus 估计反事实"如果当时没分手"，改进 off-policy evaluation。
- **(F6)** **Fairness**：研究算法婚配中的群体公平约束（demographic parity / equalized odds in matching）。

> **作者声明**：作者本人尚未收敛。审稿意见请发送至 not_yet_converged@anonymous.lab。

---

## 参考文献

[1] McCall, J. J. (1970). Economics of information and job search. *Quarterly Journal of Economics*, 84(1), 113–126.
[2] Dynkin, E. B. (1963). The optimum choice of the instant for stopping a Markov process. *Soviet Mathematics*, 4, 627–629.
[3] Tsitsiklis, J. N., & Van Roy, B. (1999). Optimal stopping of Markov processes: Hilbert space theory, approximation algorithms, and an application to pricing high-dimensional financial derivatives. *IEEE Transactions on Automatic Control*, 44(10), 1840–1851.
[4] Yu, H., & Bertsekas, D. P. (2007). Q-learning algorithms for optimal stopping based on least squares. *European Control Conference*.
[5] Backstrom, L., & Kleinberg, J. (2014). Romantic partnerships and the dispersion of social ties: A network analysis of relationship status on Facebook. *CSCW*.
[6] Joel, S., Eastwick, P. W., et al. (2020). Machine learning uncovers the most robust self-report predictors of relationship quality across 43 longitudinal couples studies. *PNAS*, 117(32), 19061–19071.
[7] Arnett, J. J. (2000). Emerging adulthood: A theory of development from the late teens through the twenties. *American Psychologist*, 55(5), 469–480.
[8] Mnih, V., et al. (2015). Human-level control through deep reinforcement learning. *Nature*, 518, 529–533.
[9] Bertsekas, D. P., & Tsitsiklis, J. N. (1996). *Neuro-Dynamic Programming*. Athena Scientific.
[10] Even-Dar, E., & Mansour, Y. (2003). Learning rates for Q-learning. *Journal of Machine Learning Research*, 5, 1–25.
[11] Sutton, R. S., & Barto, A. G. (2018). *Reinforcement Learning: An Introduction* (2nd ed.). MIT Press.
[12] Bearden, J. N. (2006). A new secretary problem with rank-based selection and cardinal payoffs. *Journal of Mathematical Psychology*, 50(1), 58–59.
[13] Becker, S., Cheridito, P., & Jentzen, A. (2019). Deep optimal stopping. *Journal of Machine Learning Research*, 20(74), 1–25.
[14] Littman, M. L. (1994). Markov games as a framework for multi-agent reinforcement learning. *ICML*.
[15] Hu, J., & Wellman, M. P. (2003). Nash Q-learning for general-sum stochastic games. *Journal of Machine Learning Research*, 4, 1039–1069.
[16] Heinrich, J., & Silver, D. (2016). Deep reinforcement learning from self-play in imperfect-information games. *arXiv:1603.01121*.
[17] Schaul, T., Quan, J., Antonoglou, I., & Silver, D. (2016). Prioritized experience replay. *ICLR*.
[18] Tsitsiklis, J. N., & Van Roy, B. (1997). An analysis of temporal-difference learning with function approximation. *IEEE Transactions on Automatic Control*, 42(5), 674–690.
[19] Sutton, R. S., Maei, H. R., et al. (2009). Fast gradient-descent methods for temporal-difference learning with linear function approximation. *ICML*.
[20] Lin, L.-J. (1992). Self-improving reactive agents based on reinforcement learning, planning and teaching. *Machine Learning*, 8, 293–321.
[21] Jin, C., Allen-Zhu, Z., Bubeck, S., & Jordan, M. I. (2018). Is Q-learning provably efficient? *NeurIPS*.
[22] Hofstede, G. (2001). *Culture's Consequences: Comparing Values, Behaviors, Institutions and Organizations Across Nations* (2nd ed.). Sage.
[23] Watkins, C. J. C. H., & Dayan, P. (1992). Q-learning. *Machine Learning*, 8(3), 279–292.
[24] Ferguson, T. S. (1989). Who solved the secretary problem? *Statistical Science*, 4(3), 282–289.
[25] Eastwick, P. W., & Hunt, L. L. (2014). Relational mate value: Consensus and uniqueness in romantic evaluations. *Journal of Personality and Social Psychology*, 106(5), 728–751.

---

## 附录 A：超参数完整列表

| 超参数 | 符号 | 取值 | 说明 |
|---|---|---:|---|
| 折扣因子 | $\gamma$ | 0.95 | 对应约 20-step 有效视野 |
| 资格迹衰减 | $\lambda$ | 0.7 | 由 §7.3(b) 选定 |
| 初始探索率 | $\varepsilon_0$ | 1.0 | 完全随机起步 |
| 最小探索率 | $\varepsilon_{\min}$ | 0.05 | 保留少量探索 |
| 退火速率 | $\kappa$ | 0.08 | 约 50 step 衰减至 $\varepsilon_{\min}$ |
| 回放缓冲容量 | $\lvert\mathcal{D}\rvert$ | $10^4$ | 由 §7.3(c) 选定 |
| Mini-batch | $K$ | 32 | 标准 DQN 设定 |
| Target 同步周期 | $\tau$ | 200 | DQN 经验值 |
| PER 优先级指数 | $\omega$ | 0.6 | 由 §7.3(d) 选定 |
| PER IS 校正 | $\beta$ | $0.4\to 1.0$ | 线性退火 |
| 收敛阈值 | $\delta_{\text{tol}}$ | $10^{-3}$ | $\ell_\infty$ |
| 即时奖励权重 | $\alpha,\beta_r,\eta$ | $1.0, 0.6, 0.3$ | 见 (11) |
| 终止奖励 | $R_{\text{commit}}$ | $+10$ | |
| 错配后悔 | $C_{\text{commit,regret}}$ | $-15$ | |
| 分手成本基线 | $C_{\text{breakup,0}}$ | $-2$ | 随 age 单调升 |
| 深度版隐层 | — | $[128, 128, 128]$ | ReLU |
| 深度版优化器 | — | Adam, lr=$3\times 10^{-4}$ | |

## 附录 B：符号表

| 符号 | 含义 |
|---|---|
| $s_t, a_t, r_t$ | 第 $t$ 步状态/动作/即时奖励 |
| $\mathcal{S}, \mathcal{A}$ | 状态空间、动作空间 |
| $\mathcal{P}, \mathcal{R}$ | 转移核、奖励函数 |
| $Q^\pi(s,a), V^\pi(s)$ | 策略 $\pi$ 的状态-动作 / 状态值函数 |
| $Q^\*, V^\*, \pi^\*$ | 最优值函数与最优策略 |
| $\mathcal{T}^\*$ | Bellman 最优性算子 |
| $\pi(a\mid s)$ | 策略（动作的条件分布）|
| $\gamma$ | 折扣因子 |
| $\lambda$ | 资格迹衰减系数 |
| $\varepsilon_t$ | 第 $t$ 步探索率 |
| $\alpha_t$ | 学习率 |
| $\delta_t$ | TD 误差 |
| $e_t(s,a)$ | 资格迹 |
| $\mathcal{D}$ | 经验回放缓冲 |
| $K$ | mini-batch size |
| $\tau$ | target network 同步周期 |
| $\omega$ | PER 优先级指数 |
| $\bar T_{\text{conv}}$ | 平均收敛迭代轮数 |
| $J^\pi$ | 策略 $\pi$ 的平均回报 |
| $P_{\text{regret}}$ | commit 后后悔概率 |
| $b_t(s)$ | 置信状态（POMDP）|

## 附录 C：定理 1 完整证明

**定理 1（重述）**：在假设 A1–A3、Robbins-Monro (17)、ε-greedy 退火 (19) 下，LoveQ(λ)-ER 满足 $Q_t\to Q^\*$ a.s.

**证明**：将更新 (24) 改写为

$$
Q_{t+1}(s,a) = (1-\alpha_t e_t(s,a))Q_t(s,a) + \alpha_t e_t(s,a)\Big(r_t + \gamma\max_{a'} Q_t(s_{t+1},a')\Big).
$$

定义采样算子 $H_t Q := r_t + \gamma\max_{a'} Q(s_{t+1},a')$，其期望为

$$
\mathbb{E}[H_t Q\mid \mathcal{F}_t] = (\mathcal{T}^\* Q)(s_t,a_t).
$$

由引理 1，$\mathcal{T}^\*$ 是 $\ell_\infty$-范数下的 $\gamma$-收缩。定义 $\Delta_t = Q_t - Q^\*$，则

$$
\Delta_{t+1}(s,a) = (1-\alpha_t e_t)\Delta_t + \alpha_t e_t\,(H_t Q^\* - Q^\* + \mathcal{T}^\* Q_t - \mathcal{T}^\* Q^\*) = (1-\alpha_t e_t)\Delta_t + \alpha_t e_t F_t,
$$

其中 $F_t$ 满足 $\|\mathbb{E}[F_t\mid \mathcal{F}_t]\|_\infty \le \gamma\|\Delta_t\|_\infty$ 且 $\mathrm{Var}[F_t\mid\mathcal{F}_t] \le K_0(1+\|\Delta_t\|_\infty^2)$。

由 Bertsekas & Tsitsiklis [9] 命题 4.4，结合：
- (i) $\sum_t \alpha_t e_t = \infty$ (Robbins-Monro + 无穷访问)；
- (ii) $\sum_t (\alpha_t e_t)^2 < \infty$；
- (iii) 期望收缩；
- (iv) 噪声方差线性增长；

得 $\|\Delta_t\|_\infty\to 0$ a.s.，即 $Q_t\to Q^\*$。$\square$

## 附录 D：复现说明

代码（PyTorch 实现）将以 anonymous GitHub 仓库形式提供。包含：

1. `env.py`：恋爱 MDP 仿真器实现 (§3)。
2. `agent.py`：LoveQ(λ)-ER 与所有基线。
3. `train.py`：训练循环与 ε 退火。
4. `eval.py`：指标计算（$J^\pi, P_{\text{regret}}$ 等）。
5. `plot.py`：复现所有图表。
6. `configs/`：所有实验的超参数 YAML。
7. `data/`：D1 仿真生成脚本；D2 的访问通过 IRB 协议申请。

单次完整实验（30 种子，所有方法）约 60 GPU-hour。
