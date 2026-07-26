# Why

开工条件平台已经具备三层关键护栏：

- domain / store smoke
- HTTP smoke
- UI boundary smoke

但从试点投产角度看，当前仍缺一个真正可执行的“验收入口”：

- 联调人员不知道先跑哪条命令、后看什么结果；
- 虽然 smoke 已经存在，但没有统一输出成试点验收清单；
- runbook 里缺少与当前脚本一致的最小验收路径。

继续在局部页面上打磨，不会显著提升投产确定性；相反，把这三层 smoke 收口成一个单入口 acceptance 命令，并同步 runbook，能更快把“可运行”推进到“可重复验收、可交付”。

# What Changes

- 增加开工条件试点统一验收脚本，串联 domain / HTTP / UI smoke。
- 增加 package script 入口，形成稳定命令。
- 同步 runbook，让真实样本联调前后有一致的验收步骤。
- 补轻量 smoke，锁住 acceptance script 入口。

# Capabilities

## Modified Capabilities

- `opening-condition-pilot-acceptance-smoke`

# Impact

- `package.json`
- `scripts/`
- `docs/opening-condition-single-project-trial-runbook.md`
- `server/productBoundarySmoke.test.mjs`
