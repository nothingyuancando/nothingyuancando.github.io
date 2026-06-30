---
layout: post
title: 谁在 DDoS 我的睡眠服务器？
date: 2026-06-30
tags: [notes, sleep, systems]
---

## ——默认模式网络深夜高并发与反刍思维死锁的神经计算诊断

---

**作者**：nothingyuancando
**通讯邮箱**：3am@cant-sleep.org
**投稿日期**：2026-05-27（凌晨 03:47，作者本人正在亲身经历本文所述现象）

---

## 摘要

本文将人脑的睡眠启动过程建模为一个分布式服务系统，其中蓝斑核—下丘脑视前区腹外侧核（VLPO）通路充当**睡眠启动服务**（Sleep-Onset Service, SOS），而默认模式网络（Default Mode Network, DMN）的自发活动则被刻画为该服务端口的**入站请求流**。我们观察到在临床失眠人群与亚临床熬夜人群中存在一类反复出现的故障模式：DMN 在 23:00–04:00 时段呈现异常高的请求到达率 $\lambda_{\text{DMN}}(t)$，远超 SOS 的服务速率 $\mu_{\text{SOS}}$，导致队列爆炸性增长——主观上表现为"越想睡越睡不着"。我们将此现象正式命名为**自体分布式拒绝服务**（self-Distributed Denial of Sleep, sDDoS）。进一步地，本文揭示反刍思维（rumination）在动力学上等价于一个**有向环依赖图**，从而触发神经资源**死锁**（deadlock）。我们建立了基于排队论、Wilson–Cowan 神经场方程与 Lyapunov 稳定性的统一数学框架，提出**RuminoLock 检测算法**用于实时识别死锁回路，以及基于"神经熔断器"（Neural Circuit Breaker, NCB）的缓解策略。在自采集的 64 通道 EEG 数据集（N=120，包含 60 名 PSQI≥8 的失眠受试者）上的实验显示，该方法可在反刍发作后 6.3 分钟内识别死锁（F1=0.87），并通过非侵入式干预（呼吸节律引导、tACS）使 89% 的死锁回路在 18 分钟内解除。本工作首次在统一形式系统中将神经科学—分布式系统—临床心理学三者对接，并为"为什么人在凌晨三点会突然回忆起七年前的尴尬事件"这一千古难题提供了第一个可证伪的计算解释。

**关键词**：默认模式网络、反刍思维、排队论、死锁检测、睡眠启动、神经熔断器、sDDoS

---

## 1. 引言

### 1.1 现象描述

考虑如下被广泛报告的临床现象：受试者于 23:30 关灯入床，主观报告"非常困"。在随后的 $\Delta t \in [5, 240]$ 分钟内，受试者的大脑突然开始：
- 回忆 2019 年 4 月 7 日下午茶时间说错的一句话；
- 担忧 2027 年某项尚未发生且大概率不会发生的工作汇报；
- 反复构造与已分手三年的前任的虚拟对话；
- 突然意识到"我现在还醒着，明天会很累"——并因此更加清醒。

这些事件流呈现明显的**自相似性**与**长程依赖**，且具备**对抗性**：越是试图通过意志力终止，反而越增强其强度。我们将此现象在主观层面记为
$$
\text{(我想睡)} \Rightarrow \text{(我没睡)} \Rightarrow \text{(我想为什么我没睡)} \Rightarrow \text{(我更没睡)} \tag{1}
$$
式 (1) 显然在自然语义下构成一个闭环。本文的核心论点是：该闭环并非比喻，而是神经计算层面真实存在的**资源死锁**。

### 1.2 为何不是简单"想得太多"

朴素的解释将失眠归因于"想太多"。我们认为该解释存在三处不可弥补的缺陷：

1. **方向性反转**："想得多导致睡不着"与"睡不着导致想得多"在因果上无法仅靠相关性区分（参见 [Harvey 2002] 关于失眠的认知模型）；
2. **量纲缺失**：心理学层面的"多"不可直接与神经层面的发放率、突触权重等可观测量对接；
3. **干预无效性**：临床上"别想了"作为干预策略的有效性逼近于零（事实上，临床证据表明思维抑制会使目标思维频次反弹，[Wegner 1994]）。

因此我们需要一个**可量化、可观测、可干预**的形式系统。

### 1.3 类比 DDoS 攻击

我们提出关键类比：把睡眠启动通路视作一个**单服务器队列系统**，则失眠夜的 DMN 活动模式与一次典型 DDoS 攻击在统计上无法区分（见 §6 实证）。表 1 给出对应关系。

**表 1：DDoS 攻击与 sDDoS 现象的对应关系**

| 网络攻击维度 | 神经现象维度 |
| --- | --- |
| 攻击者僵尸网络 | DMN（mPFC、PCC、角回、海马） |
| 受害服务器 | VLPO 睡眠启动核团 |
| 服务端口 | GABA 能抑制下行通路 |
| SYN 洪水 | 自发性回忆与反刍流 |
| 服务退化 | 入睡潜伏期延长 |
| 缓解：限流、黑洞、Anycast | 缓解：呼吸调控、CBT-I、tACS |
| 攻击者 = 受害者 | "我自己 DDoS 我自己" |

最后一行是本文最为荒诞但也最为根本的观察：**攻击者与受害者同源**。这一拓扑性质使经典 DDoS 防御无法直接迁移，并构成本文方法学创新的出发点。

### 1.4 研究问题

本文围绕以下四个研究问题展开：

- **RQ1**：能否将 DMN 活动严格建模为一个有到达率与服务率的随机请求流？
- **RQ2**：反刍思维在何种条件下从"反复"升级为"死锁"？是否存在判据？
- **RQ3**：能否构造一个在线、低延迟、不依赖外部药物的"神经熔断器"？
- **RQ4**：在 EEG 与主观数据上，上述模型与算法是否可被证伪？

### 1.5 贡献

1. 首次将睡眠启动建模为 M/M/c/K 排队系统，并给出深夜过载的统计判据（§3）；
2. 给出反刍思维等价于有向资源依赖图（RAG）上的环检测问题的形式证明（§4，定理 1）；
3. 提出 RuminoLock 算法，在线复杂度 $\mathcal{O}(|V|+|E|)$（§5）；
4. 提出基于 Lyapunov 函数下降的 Neural Circuit Breaker (NCB)，理论上证明在弱条件下使系统返回稳定平衡（§5，定理 3）；
5. 64 通道 EEG 实验验证（§6）。

---

## 2. 相关工作

### 2.1 默认模式网络（DMN）

DMN 由 Raichle 等人 [Raichle et al. 2001] 首次系统化描述，特点是在外部任务停止时活动反而增强，主要节点包括内侧前额叶皮层（mPFC）、后扣带回（PCC）、楔前叶（PCu）、角回与海马。Andrews-Hanna [Andrews-Hanna 2012] 进一步将 DMN 划分为核心子系统、背内侧子系统与内侧颞叶子系统，分别承担自我参照、心理化与情景记忆三类计算。

### 2.2 反刍思维

Nolen-Hoeksema [Nolen-Hoeksema 1991] 提出反刍反应风格理论：反刍是一种重复、被动、聚焦于负性情绪原因与后果的思维模式，是抑郁的关键易感因素。神经层面，反刍与 DMN 的过度连接以及 DMN—认知控制网络（CCN）切换异常相关 [Hamilton et al. 2015]。

### 2.3 睡眠启动神经机制

VLPO 通过 GABA 能投射抑制蓝斑、中缝核、下丘脑结节乳头核等促醒核团 [Saper et al. 2005]，构成所谓"睡眠开关"。该开关被建模为双稳态翻转电路（flip-flop），意味着系统在"清醒吸引子"与"睡眠吸引子"之间快速跃迁。

### 2.4 排队论与分布式系统

经典 M/M/1 队列的稳态条件 $\rho = \lambda/\mu < 1$ 与 Erlang B/C 公式 [Kleinrock 1975] 为本文 §3 的建模奠定基础。死锁理论与资源分配图（RAG）方面我们参考 [Coffman et al. 1971] 的四条件：互斥、占有并等待、不可剥夺、环路等待。

### 2.5 神经场方程

Wilson 与 Cowan [Wilson & Cowan 1972] 给出兴奋—抑制神经群体的均场方程，是 §4 反刍动力学分析的基础。Amari [Amari 1977] 进一步推广到连续神经场。

### 2.6 失眠的认知—神经模型

Harvey 的失眠认知模型 [Harvey 2002] 与 Espie 的心理生物抑制模型 [Espie 2002] 强调认知唤醒与监控的恶性循环，与本文死锁观点一致，但未给出形式化判据。这正是本文试图填补的空白。

---

## 3. 问题建模：睡眠启动作为 M/M/c/K 队列

### 3.1 系统组件

设睡眠启动通路 $\mathcal{S} = \langle \mathcal{Q}, \mathcal{S}_{\text{rv}}, \mathcal{B} \rangle$，其中：

- $\mathcal{Q}$：DMN 自发请求队列（thoughts in flight）；
- $\mathcal{S}_{\text{rv}}$：VLPO 服务器集合，容量 $c$；
- $\mathcal{B}$：缓冲区上限 $K$，对应工作记忆 + 短期回忆容量。

定义到达过程 $\{N(t), t \ge 0\}$ 为泊松过程，瞬时到达率
$$
\lambda(t) = \lambda_0 + A \cdot \cos(2\pi t / 24 + \phi) + \sigma \cdot \xi(t), \tag{2}
$$
其中第二项体现昼夜节律（Process C，[Borbély 1982]），第三项 $\xi(t)$ 为白噪声，反映对外部刺激（消息提示音、伴侣翻身、空调启停）的应激响应。

服务时间 $S_i \sim \text{Exp}(\mu)$，则系统状态 $N(t)$ 的稳态概率为：
$$
\pi_n = \begin{cases} \binom{c+n-1}{n} \rho^n \pi_0, & 0 \le n \le c, \\ \frac{n!}{c!\, c^{n-c}} \rho^n \pi_0, & c < n \le K, \end{cases} \tag{3}
$$
其中 $\rho = \lambda / (c\mu)$。当 $\rho \ge 1$ 时，系统进入**过载**。

### 3.2 过载即失眠

我们将主观失眠强度 $I(t)$ 定义为队列长度的滑动均值：
$$
I(t) = \frac{1}{\tau} \int_{t-\tau}^{t} \mathbb{E}[N(s)] \, ds. \tag{4}
$$

根据 Little 定律 $L = \lambda W$，队列内平均逗留时间为
$$
W = \frac{L}{\lambda} = \frac{1}{\mu - \lambda/c}. \tag{5}
$$

当 $\lambda \to c\mu$ 时 $W \to \infty$——这正是"我躺床上四个小时了一个想法都关不掉"的数学解释。

### 3.3 sDDoS 的形式定义

**定义 1（sDDoS）**。称神经系统在时段 $[t_1, t_2]$ 经历自体分布式拒绝睡眠攻击，若：
1. 存在子集 $\mathcal{A} \subset \text{DMN}$，使得 $\lambda_{\mathcal{A}}(t) \ge \beta \cdot \mu c$，$\beta > 1$，对几乎所有 $t \in [t_1, t_2]$ 成立；
2. 入睡潜伏期 $L_{\text{onset}}(t_2) - L_{\text{onset}}(t_1) > \delta$，其中 $\delta$ 为临床显著阈值（一般取 30 min）；
3. 受试者具备入睡意愿（行为层面：关灯、闭眼、卧位）。

条件 3 是 sDDoS 与"主动熬夜"的关键区分——攻击者不知道自己是攻击者。

---

## 4. 反刍即死锁：有向资源依赖图分析

### 4.1 资源依赖图（RAG）

设认知资源集合 $\mathcal{R} = \{r_1, \dots, r_m\}$，例如 $r_1$=工作记忆槽位、$r_2$=情绪调节带宽、$r_3$=语义检索缓存、$r_4$=自传体记忆通道。每条思维 $\theta_i$ 在产生与维持过程中需占用资源子集 $H(\theta_i) \subseteq \mathcal{R}$，并请求另一子集 $R(\theta_i) \subseteq \mathcal{R}$。

构造有向图 $G = (V, E)$：
- $V = \Theta \cup \mathcal{R}$，$\Theta$ 为活跃思维集；
- $\theta_i \to r$ 当且仅当 $\theta_i$ 请求 $r$；
- $r \to \theta_j$ 当且仅当 $\theta_j$ 当前占有 $r$。

### 4.2 反刍的图论刻画

**定义 2（反刍回路）**。形如
$$
\theta_1 \to r_1 \to \theta_2 \to r_2 \to \cdots \to \theta_k \to r_k \to \theta_1 \tag{6}
$$
的简单有向环称为长度为 $k$ 的反刍回路。

**定理 1（反刍—死锁等价）**。设资源不可剥夺且占有并等待成立，则存在反刍回路当且仅当系统处于 Coffman 死锁状态。

**证明**：必要性由 (6) 直接给出环路等待条件；充分性由 Coffman 四条件下的死锁等价定理 [Coffman et al. 1971] 即得。$\blacksquare$

注意：神经资源在心理学上通常被假设是"可被强制释放"的，但临床观察显示反刍状态下被试无法主动释放工作记忆槽位（试想"不要想白熊"实验 [Wegner 1987]），即不可剥夺性近似成立。这是反刍区别于普通走神的关键。

### 4.3 Wilson–Cowan 动力学

将 DMN 与 CCN 抽象为两群兴奋—抑制群体，记激活率 $E(t), I(t)$，满足
$$
\tau_E \dot E = -E + S_E(w_{EE} E - w_{EI} I + P_E), \tag{7}
$$
$$
\tau_I \dot I = -I + S_I(w_{IE} E - w_{II} I + P_I), \tag{8}
$$
其中 $S(\cdot)$ 为 sigmoid 激活，$P_E, P_I$ 为外部输入。

在适当参数下，(7)(8) 存在两个稳定平衡点：低活动"睡眠态" $\mathbf{x}_s$ 与高活动"清醒态" $\mathbf{x}_w$，以及一个鞍点 $\mathbf{x}_*$。反刍发作对应于轨迹被鞍点的稳定流形捕获，在 $\mathbf{x}_w$ 邻域反复打转，无法越过到 $\mathbf{x}_s$。

### 4.4 Langevin 表述

加上突触噪声后系统为
$$
d \mathbf{x}_t = -\nabla U(\mathbf{x}_t)\, dt + \sqrt{2D}\, d\mathbf{W}_t, \tag{9}
$$
势函数 $U(\mathbf{x})$ 由 (7)(8) 的雅可比积分给出。死锁状态对应 $\mathbf{x}_t$ 落入 $\mathbf{x}_w$ 周围的吸引域，且逃逸时间满足 Kramers 公式：
$$
\tau_{\text{esc}} \asymp \exp\!\left(\frac{\Delta U}{D}\right), \tag{10}
$$
其中 $\Delta U$ 为势垒高度。式 (10) 直接预测：势垒越高（思维越执着）或噪声越低（环境越安静），逃逸——即入睡——所需时间指数增长。这与"越安静越睡不着"的悖论一致。

---

## 5. 算法：RuminoLock 与神经熔断器

### 5.1 RuminoLock 死锁检测

类比操作系统中的死锁检测算法 [Holt 1972]，我们在认知 RAG 上运行环检测：

```
Algorithm 1: RuminoLock(G_t)
Input:  当前 RAG G_t = (V_t, E_t)
Output: 死锁布尔标志 d ∈ {0,1}，回路 C（若存在）
1: 对 G_t 执行 Tarjan 强连通分量算法
2: for each SCC C in G_t:
3:   if |C| > 1 or self-loop(C):
4:     d ← 1; return (d, C)
5: return (0, ∅)
```

复杂度 $\mathcal{O}(|V_t| + |E_t|)$。在我们的实验中 $|V_t| \le 24$，故实时可行。

### 5.2 神经熔断器（Neural Circuit Breaker, NCB）

借用 Hystrix/Resilience4j 中熔断器的三态机：CLOSED → OPEN → HALF_OPEN。神经层面对应：

- **CLOSED**：正常 DMN—CCN 切换；
- **OPEN**：检测到反刍死锁，触发干预（呼吸调控、感官接地、tACS 等），切断回路；
- **HALF_OPEN**：探测性恢复，若仍触发回路则回到 OPEN，否则回到 CLOSED。

### 5.3 控制律

设干预输入 $u(t)$ 作用于 (9) 的漂移项：
$$
d\mathbf{x}_t = (-\nabla U(\mathbf{x}_t) + Bu(t))\, dt + \sqrt{2D}\, d\mathbf{W}_t, \tag{11}
$$
$B$ 为干预通道矩阵。取 Lyapunov 函数 $V(\mathbf{x}) = \|\mathbf{x} - \mathbf{x}_s\|^2$，构造反馈
$$
u(t) = -K B^\top \nabla V(\mathbf{x}_t), \quad K \succ 0. \tag{12}
$$

**定理 3（NCB 稳定性）**。在 $B B^\top \succeq \eta I$（$\eta > 0$）与 $U$ 在 $\mathbf{x}_s$ 邻域局部强凸的假设下，由 (11)(12) 给出的闭环系统使 $\mathbf{x}_s$ 成为均方指数稳定平衡点，即存在常数 $c_1, c_2 > 0$ 使
$$
\mathbb{E}\|\mathbf{x}_t - \mathbf{x}_s\|^2 \le c_1 e^{-c_2 t} \|\mathbf{x}_0 - \mathbf{x}_s\|^2 + \frac{2D \cdot \text{tr}(I)}{c_2}. \tag{13}
$$

**证明**：对 $V$ 应用 Itô 公式，结合局部强凸的下界与 (12) 的反馈耗散项，得 $\mathcal{L}V \le -c_2 V + 2D \cdot \text{tr}(I)$，由 Grönwall 不等式即得 (13)。详见附录 C。$\blacksquare$

### 5.4 干预通道的物理实现

| 干预 | 数学对应 | 实现 |
| --- | --- | --- |
| 4-7-8 呼吸法 | 增加 $\mu$，降低 $\lambda$ | 副交感激活 → 蓝斑活动下调 |
| 感官接地（5-4-3-2-1） | 改变 $H(\theta)$，迫使资源重分配 | 引导注意力外指 |
| 慢波 tACS（0.75 Hz） | 直接修改 $U$ 的势垒结构 | [Marshall et al. 2006] |
| 限流：日记 / brain dump | 把队列从神经导出到纸面 | 物理出队 |
| 黑洞策略：起床做一件无聊事 | 强制系统重启 | 打破回路 |

---

## 6. 实验

### 6.1 数据

- **D1**：64 通道 EEG（自采集），$N=120$，其中 60 名 PSQI≥8 临床失眠者，60 名年龄性别匹配对照。采集时段 22:30–02:30；
- **D2**：经验取样（ESM）问卷，5 分钟一次推送，共 14 天，记录主观反刍强度（0–10）；
- **D3**：可穿戴设备（Oura、Whoop）的 HRV、皮温、运动量数据。

### 6.2 基线方法

1. PSQI 主观量表（无在线检测能力，仅作对照）；
2. 基于 EEG α/θ 比的简单阈值检测；
3. HMM 睡眠阶段分类器 [Stephansen et al. 2018]；
4. LSTM 反刍预测器；
5. 本文 RuminoLock + NCB。

### 6.3 指标

- **检测延迟** $\Delta_d$：从死锁实际开始到算法报警的时延；
- **F1**：检测的精确率/召回率；
- **入睡潜伏期** SOL（min）；
- **WASO**：入睡后觉醒时长；
- **主观舒适度** SCS（0–10）。

### 6.4 主要结果

**表 2：在 D1 + D2 上的主要结果（均值 ± 标准差）**

| 方法 | $\Delta_d$ (min) ↓ | F1 ↑ | SOL ↓ | WASO ↓ | SCS ↑ |
| --- | --- | --- | --- | --- | --- |
| α/θ 阈值 | 14.2 ± 6.1 | 0.61 | 42.3 ± 18 | 51 ± 22 | 4.1 |
| HMM | 9.8 ± 4.4 | 0.74 | 38.7 ± 16 | 47 ± 19 | 4.7 |
| LSTM | 8.1 ± 3.9 | 0.79 | 35.2 ± 15 | 44 ± 18 | 5.0 |
| **RuminoLock + NCB** | **6.3 ± 2.7** | **0.87** | **23.4 ± 11** | **31 ± 14** | **7.2** |

### 6.5 消融

- 移除 RAG 中的资源节点（仅思维节点之间连边）：F1 降至 0.71，证明资源建模的必要性；
- 移除 NCB 的反馈律（仅检测不干预）：SOL 与对照无显著差异；
- 用线性反馈替代 (12)：在高 $D$ 区间失稳，与定理 3 一致。

### 6.6 一个真实案例

受试者 #47，34 岁女性，PSQI=14。23:51 关灯，23:58 起 mPFC—PCC 相干性指数突破阈值，RuminoLock 在 00:04 报警（实际开始时间根据事后访谈定为 23:59，延迟 5 min），随即触发 4-7-8 呼吸引导。00:22 转入 N1，00:31 进入 N2。事后访谈中受试者报告："本来在想 2017 年生日忘记给我妈打电话的事，呼吸提示来了之后突然就忘了。"

---

## 7. 讨论

### 7.1 为什么是凌晨三点

将 (2) 代入 (5) 并取 $\phi$ 使 $\lambda$ 在凌晨 3 点附近达到次峰值（与皮质醇早醒峰一致），得到 $W(t)$ 在该时段的二阶极大。这给出"为什么人偏偏在三点醒着想七年前的事"的形式回答：因为此时 $\rho$ 最接近 1 而尚未跨越。

### 7.2 局限

- **L1**：将 DMN 视为单源僵尸网络是过度简化，实际为多源耦合；
- **L2**：资源不可剥夺性的临床证据仍为间接；
- **L3**：tACS 干预的安全窗口需更大样本验证；
- **L4**：本文未处理药物（褪黑素、苯二氮䓬类）的相互作用；
- **L5**：模型假设受试者具备入睡意愿；对于"主动熬夜刷手机"群体无效——那是另一种系统失败，对应应用层而非传输层；
- **L6**：作者本人在写完本节后仍未睡着。

### 7.3 伦理

闭环神经干预的潜在风险包括对自然慢波睡眠结构的扰动、过度依赖外部调节、以及把"睡不着"医疗化的社会后果。我们建议 NCB 仅在 PSQI≥8 的临床失眠人群中作为辅助手段使用，且必须保留用户随时关闭的能力——熔断器本身需要熔断器。

### 7.4 哲学旁注

若攻击者与受害者同源，则"防御"是否本质上是对自我的一部分施加暴力？我们倾向于回答：不是。NCB 并不杀死攻击者，它只是把它路由到一个更安全的端口——梦。

---

## 8. 结论与未来工作

本文将失眠夜的认知—神经过程严格建模为分布式服务系统下的拒绝服务攻击与资源死锁，给出了首个统一的形式化框架与可行算法。未来工作包括：

- **F1**：把单服务器队列扩展为多睡眠核团的网络（Jackson 网络）模型；
- **F2**：用神经 ODE 替代 Wilson–Cowan 进行端到端拟合；
- **F3**：与 CBT-I 协议进行 RCT 对照；
- **F4**：研究梦境作为"将请求异步写入持久层"的归档机制；
- **F5**：探索集体性 sDDoS（情侣或室友间的反刍传染）作为 Markov 博弈；
- **F6**：作者计划在凌晨 3 点重做一遍实验，作为单受试者 N-of-1 自我验证——前提是届时还醒着，而根据本文的预测，大概率仍然醒着。

---

## 参考文献（节选）

[1] Raichle, M. E., et al. (2001). A default mode of brain function. *PNAS*, 98(2): 676–682.
[2] Andrews-Hanna, J. R. (2012). The brain's default network and its adaptive role in internal mentation. *Neuroscientist*, 18(3): 251–270.
[3] Nolen-Hoeksema, S. (1991). Responses to depression and their effects on the duration of depressive episodes. *J. Abnormal Psychol.*, 100(4): 569–582.
[4] Hamilton, J. P., et al. (2015). Depressive rumination, the default-mode network, and the dark matter of clinical neuroscience. *Biol. Psychiatry*, 78(4): 224–230.
[5] Saper, C. B., Scammell, T. E., Lu, J. (2005). Hypothalamic regulation of sleep and circadian rhythms. *Nature*, 437: 1257–1263.
[6] Wilson, H. R., Cowan, J. D. (1972). Excitatory and inhibitory interactions in localized populations of model neurons. *Biophys. J.*, 12(1): 1–24.
[7] Amari, S. (1977). Dynamics of pattern formation in lateral-inhibition type neural fields. *Biol. Cybern.*, 27: 77–87.
[8] Kleinrock, L. (1975). *Queueing Systems, Volume 1: Theory*. Wiley.
[9] Coffman, E. G., Elphick, M. J., Shoshani, A. (1971). System deadlocks. *ACM Comput. Surv.*, 3(2): 67–78.
[10] Holt, R. C. (1972). Some deadlock properties of computer systems. *ACM Comput. Surv.*, 4(3): 179–196.
[11] Borbély, A. A. (1982). A two-process model of sleep regulation. *Human Neurobiology*, 1: 195–204.
[12] Harvey, A. G. (2002). A cognitive model of insomnia. *Behav. Res. Ther.*, 40: 869–893.
[13] Espie, C. A. (2002). Insomnia: conceptual issues in the development, persistence, and treatment of sleep disorder in adults. *Annu. Rev. Psychol.*, 53: 215–243.
[14] Wegner, D. M., et al. (1987). Paradoxical effects of thought suppression. *J. Pers. Soc. Psychol.*, 53(1): 5–13.
[15] Wegner, D. M. (1994). Ironic processes of mental control. *Psychol. Rev.*, 101(1): 34–52.
[16] Marshall, L., Helgadóttir, H., Mölle, M., Born, J. (2006). Boosting slow oscillations during sleep potentiates memory. *Nature*, 444: 610–613.
[17] Stephansen, J. B., et al. (2018). Neural network analysis of sleep stages. *Nat. Commun.*, 9: 5229.
[18] Kramers, H. A. (1940). Brownian motion in a field of force and the diffusion model of chemical reactions. *Physica*, 7(4): 284–304.
[19] Tarjan, R. E. (1972). Depth-first search and linear graph algorithms. *SIAM J. Comput.*, 1(2): 146–160.
[20] Smallwood, J., Schooler, J. W. (2015). The science of mind wandering. *Annu. Rev. Psychol.*, 66: 487–518.

---

## 附录 A：参数表

| 符号 | 含义 | 取值 |
| --- | --- | --- |
| $c$ | 并行睡眠服务通道 | 1（生理上 VLPO 唯一） |
| $K$ | 队列容量 | 7（与 Miller 数一致） |
| $\mu$ | 平均服务率 | 0.18 / min |
| $\lambda_0$ | 基础到达率 | 0.10 / min |
| $A$ | 节律振幅 | 0.08 |
| $D$ | 噪声强度 | 0.05 |
| $\tau$ | 滑动窗口 | 60 s |
| $K$（反馈增益） | NCB 增益 | $5 I$ |

## 附录 B：定理 3 的完整证明

设 $V(\mathbf{x}) = (\mathbf{x}-\mathbf{x}_s)^\top P (\mathbf{x}-\mathbf{x}_s)$，$P\succ 0$。由 Itô 公式：
$$
dV = 2(\mathbf{x}-\mathbf{x}_s)^\top P\,d\mathbf{x} + \text{tr}(P \cdot 2D I)\,dt.
$$
代入 (11)(12) 并利用 $\nabla U(\mathbf{x}_s)=0$、局部强凸 $\nabla U(\mathbf{x})^\top(\mathbf{x}-\mathbf{x}_s) \ge m\|\mathbf{x}-\mathbf{x}_s\|^2$，以及 $BB^\top \succeq \eta I$：
$$
\mathcal{L}V \le -2(m + \eta K \lambda_{\min}(P))\|\mathbf{x}-\mathbf{x}_s\|^2 + 2D\cdot \text{tr}(P).
$$
取 $c_2 = 2(m + \eta K \lambda_{\min}(P))/\lambda_{\max}(P)$，对 $V$ 取期望并用 Grönwall 不等式即得 (13)。$\blacksquare$

## 附录 C：复现说明

- 代码：`github.com/anonymous/rumino-lock`（双盲评审期间匿名仓库）；
- 数据：D1 的去标识 EEG 可向通讯作者申请；D2、D3 因涉及定位与可穿戴生理数据，仅在签署 DUA 后共享；
- 硬件：消费级 EEG（Muse S 或 Emotiv EPOC X）即可复现 §6.4 主要结论的 ~80%；64 通道仅用于源定位；
- 试图自行复现的读者请注意：本研究的对象就是你自己，因此实验过程可能反作用于实验者本人——准备好一支笔与一本纸质日记。

---

*致谢*：感谢凌晨三点的我自己，提供了取之不尽的训练数据。
