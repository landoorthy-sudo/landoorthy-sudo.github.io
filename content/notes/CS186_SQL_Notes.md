---
title: CS186 数据库导论：SQL 语言笔记
date: 2026-01-10T16:47:39+08:00
tags: []
series: []
featured: false
---

Summary：记录了我在学习 Berkeley 的 CS186 数据库导论 第一部分的学习笔记。

<!--more-->

## 1. SQL 概述与子语言
SQL 由关系型数据库管理系统（**RDBMS**）负责执行与优化，主要包含：
* **DDL (Data Definition Language)**：用于定义数据结构。
    * `CREATE TABLE`：创建表。
    * **约束**：`PRIMARY KEY`（唯一且非空）、`FOREIGN KEY`（引用关系）。
* **DML (Data Manipulation Language)**：用于查询和操作数据。

---

## 2. DML 基础查询框架
标准的 DML 查询逻辑执行顺序通常如下：
```sql
SELECT [DISTINCT] ... 
FROM ... 
WHERE ... 
GROUP BY ... 
HAVING ... 
ORDER BY ... 
LIMIT ...

```

* **SELECT DISTINCT**：去除查询结果中的重复行。
* **ORDER BY**：默认升序排列。
* **LIMIT**：限制返回的行数。
* **重命名与计算**：可以使用 `AS` 对表或列重命名，或对列进行算术计算。

---

## 3. 聚合函数与分组 (Aggregate & Group By)

* **常用函数**：`MAX`、`MIN`、`AVG`、`COUNT`、`SUM`。
* **注意**：`DISTINCT AGGREGATE`（聚合前去重）与 `SELECT DISTINCT`（对最终结果去重）作用范围不同。
* **分组过滤**：`GROUP BY` 分组，`HAVING` 对分组后的结果按条件过滤。

---

## 4. 逻辑算子与集合运算 (AND/OR vs. INTERSECT/UNION)

这一部分重点探讨了逻辑需求在不同语境下的实现方案：

* **OR 与 UNION**：
* `OR` 出现在 `WHERE` 语句里，筛选出满足任一条件的元组。
* `UNION` 结合两个查询结果，在同样关系、同样投影上二者得到的结果相同。
* `UNION ALL` 相比 `OR` 不会去重，执行效率更高。


* **AND 与 INTERSECT**：
* `AND` 要求元组同时满足两个需求（若需求冲突则返回空集）。
* **不能互换**：`AND` 与 `INTERSECT` 不同，后者可能会出现“中间结果爆炸”。



---

## 5. 集合 (SET) 与 多重集合 (MULTISET) 语义

在关系代数中，关系被视为集合。

* **集合语义 (SET)**：返回结果会自动去重。
* `UNION`（并集）、`INTERSECT`（交集）、`EXCEPT`（差集：左有右无）。


* **多重集合语义 (MULTISET)**：保留重复元素，使用 `ALL` 关键字。
* `UNION ALL`：出现次数相加。
* `INTERSECT ALL`：取出现次数的最小值。
* `EXCEPT ALL`：出现次数相减（结果不小于 0）。



---

## 6. 多表查询与连接 (Joins)

多表查询在逻辑上基于 **Cross Product**（笛卡尔积），之后再进行筛选。

* **INNER JOIN**：保留连接条件（`ON` 之后内容）匹配的元组。
* **NATURAL JOIN**：基于同名列自动连接（实际不常用）。
* **OUTER JOIN**：保留未匹配元组并以 `NULL` 填充。
* `LEFT` / `RIGHT` / `FULL` 分别对应保留左侧/右侧/两侧表的未匹配内容。



---

## 7. 高级子查询与复杂逻辑

* **谓词判断**：使用 `(NOT) IN`、`(NOT) EXISTS`、`ANY`、`ALL`。
* **Tough Division (关系除法)**：
* **场景**：找到预定了“所有”船只的水手。
* **实现逻辑**：找到“不存在任何一艘船，是不存在被该水手预定过的”水手 ID。


* **Argmax 查询**：
* **实现**：在子查询里先得到最大值，主查询再匹配该最大值对应的元组。
* **快捷法**：`ORDER BY ... DESC LIMIT 1`（注意：此法会忽视并列第一的情况）。



---

## 8. 视图 (Views & CTE)

* **CREATE VIEW**：长期的“命名查询”，本质是逻辑封装而非物理表（类似于函数）。
* **WITH ... AS (CTE)**：一次性视图（公用表表达式），提高代码可读性。
* **子查询**：也可以直接在查询中嵌套子查询作为临时 View。

---

## 9. NULL 值处理

* **运算**：操作 NULL 得到的依旧是 NULL。
* **过滤**：`WHERE NULL` 会返回空结果。
* **三值逻辑**：
* `FALSE AND NULL` -> `FALSE`
* `TRUE OR NULL` -> `TRUE`


* **聚合**：除了 `COUNT(*)` 外，聚合函数不计入 NULL 值。