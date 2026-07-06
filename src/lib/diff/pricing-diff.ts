import type { ExtractedPricingPlan } from "../extract/pricing";

export type ChangeType =
  | "price_increase"
  | "price_decrease"
  | "plan_added"
  | "plan_removed"
  | "plan_renamed"
  | "free_tier_changed"
  | "feature_gate_changed"
  | "usage_limit_changed"
  | "copy_changed"
  | "page_unreachable"
  | "structure_changed";

export type ChangeSeverity = "low" | "medium" | "high";

export type SnapshotForDiff = {
  id: string;
  httpStatus: number | null;
  contentHash: string;
  normalizedText: string;
  plans: ExtractedPricingPlan[];
};

export type GeneratedChangeEvent = {
  changeType: ChangeType;
  severity: ChangeSeverity;
  title: string;
  summary: string;
  details: Record<string, unknown>;
};

export function generateChangeEvents(input: {
  previous: SnapshotForDiff | null;
  current: SnapshotForDiff;
}): GeneratedChangeEvent[] {
  const { previous, current } = input;

  if (!previous) {
    return [
      {
        changeType: "structure_changed",
        severity: "low",
        title: "创建首个价格快照",
        summary: "首次抓取并建立价格页面基线。",
        details: { currentSnapshotId: current.id }
      }
    ];
  }

  if (previous.contentHash === current.contentHash) {
    return [];
  }

  const events: GeneratedChangeEvent[] = [];

  if (isReachable(previous.httpStatus) && !isReachable(current.httpStatus)) {
    events.push({
      changeType: "page_unreachable",
      severity: "high",
      title: "价格页当前不可访问",
      summary: `价格页 HTTP 状态从 ${previous.httpStatus} 变为 ${current.httpStatus ?? "未知"}。`,
      details: {
        previousStatus: previous.httpStatus,
        currentStatus: current.httpStatus
      }
    });
    return events;
  }

  const previousPlans = new Map(previous.plans.map((plan) => [plan.name, plan]));
  const currentPlans = new Map(current.plans.map((plan) => [plan.name, plan]));

  for (const plan of current.plans) {
    if (!previousPlans.has(plan.name)) {
      events.push({
        changeType: "plan_added",
        severity: "medium",
        title: `新增 ${plan.name} 套餐`,
        summary: `检测到新的 ${plan.name} 套餐区域。`,
        details: { plan }
      });
    }
  }

  for (const plan of previous.plans) {
    if (!currentPlans.has(plan.name)) {
      events.push({
        changeType: "plan_removed",
        severity: "medium",
        title: `${plan.name} 套餐区域被移除`,
        summary: `上一版存在的 ${plan.name} 套餐在当前快照中未检测到。`,
        details: { plan }
      });
    }
  }

  for (const [name, oldPlan] of previousPlans) {
    const newPlan = currentPlans.get(name);
    if (!newPlan) continue;

    const priceEvent = comparePlanPrice(oldPlan, newPlan);
    if (priceEvent) {
      events.push(priceEvent);
    }

    if (oldPlan.isFreeTier || newPlan.isFreeTier) {
      const oldLimits = stableList(oldPlan.limits);
      const newLimits = stableList(newPlan.limits);
      if (oldLimits !== newLimits) {
        events.push({
          changeType: "free_tier_changed",
          severity: "medium",
          title: "检测到免费额度变化",
          summary: `${name} 套餐的免费额度或包含项发生变化。`,
          details: {
            planName: name,
            previousLimits: oldPlan.limits,
            currentLimits: newPlan.limits
          }
        });
      }
    }

    if (stableList(oldPlan.limits) !== stableList(newPlan.limits)) {
      events.push({
        changeType: "usage_limit_changed",
        severity: "medium",
        title: `${name} 套餐使用限制发生变化`,
        summary: `${name} 套餐的请求数、tokens、席位、存储或额度文本发生变化。`,
        details: {
          planName: name,
          previousLimits: oldPlan.limits,
          currentLimits: newPlan.limits
        }
      });
    }

    if (stableList(oldPlan.features) !== stableList(newPlan.features)) {
      events.push({
        changeType: "feature_gate_changed",
        severity: "medium",
        title: `${name} 套餐功能门槛发生变化`,
        summary: `${name} 套餐的功能、支持或权限描述发生变化。`,
        details: {
          planName: name,
          previousFeatures: oldPlan.features,
          currentFeatures: newPlan.features
        }
      });
    }
  }

  if (events.length === 0) {
    events.push({
      changeType: "copy_changed",
      severity: textChangedSubstantially(previous.normalizedText, current.normalizedText)
        ? "medium"
        : "low",
      title: "价格页文案发生变化",
      summary: "页面内容 hash 已改变，但未检测到明确的套餐或价格结构变化。",
      details: {
        previousLength: previous.normalizedText.length,
        currentLength: current.normalizedText.length
      }
    });
  } else {
    events.push({
      changeType: "copy_changed",
      severity: "low",
      title: "价格页文案也发生变化",
      summary: "除结构化价格变化外，规范化文本也发生了变化。",
      details: {
        previousLength: previous.normalizedText.length,
        currentLength: current.normalizedText.length
      }
    });
  }

  return events;
}

function comparePlanPrice(
  oldPlan: ExtractedPricingPlan,
  newPlan: ExtractedPricingPlan
): GeneratedChangeEvent | null {
  if (
    oldPlan.priceAmount === null ||
    newPlan.priceAmount === null ||
    oldPlan.priceAmount === newPlan.priceAmount
  ) {
    return null;
  }

  const increased = newPlan.priceAmount > oldPlan.priceAmount;
  return {
    changeType: increased ? "price_increase" : "price_decrease",
    severity: "high",
    title: `${oldPlan.name} 套餐价格从 ${oldPlan.rawPriceText ?? oldPlan.priceAmount} 变为 ${
      newPlan.rawPriceText ?? newPlan.priceAmount
    }`,
    summary: `${oldPlan.name} 套餐价格${increased ? "上涨" : "下降"}。`,
    details: {
      planName: oldPlan.name,
      previousPrice: oldPlan,
      currentPrice: newPlan
    }
  };
}

function stableList(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join("\n");
}

function isReachable(status: number | null): boolean {
  return typeof status === "number" && status >= 200 && status < 400;
}

function textChangedSubstantially(previousText: string, currentText: string): boolean {
  const longest = Math.max(previousText.length, currentText.length, 1);
  return Math.abs(previousText.length - currentText.length) / longest > 0.15;
}
