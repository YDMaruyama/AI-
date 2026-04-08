/**
 * スキルレジストリ（シングルトン）
 * router.ts, ai-agent.ts, patterns.ts がここから情報を取得する
 */
import type {
  SkillDefinition,
  SkillHandler,
  SkillKeywordRoute,
  SkillAgentTool,
  BriefingProvider,
  FastIntentMatch,
} from './_define';

class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.id)) {
      throw new Error(`Skill "${skill.id}" is already registered`);
    }
    this.skills.set(skill.id, skill);
  }

  // ── router.ts 用 ──

  /** 全スキルのキーワードルートを登録順に連結 */
  getKeywordRoutes(): SkillKeywordRoute[] {
    const routes: SkillKeywordRoute[] = [];
    for (const skill of this.skills.values()) {
      if (skill.routes) routes.push(...skill.routes);
    }
    return routes;
  }

  /** 全スキルの会話状態ハンドラーをマージ */
  getStateRoutes(): Record<string, SkillHandler> {
    const map: Record<string, SkillHandler> = {};
    for (const skill of this.skills.values()) {
      if (skill.states) {
        for (const s of skill.states) {
          map[s.stateName] = s.handler;
        }
      }
    }
    return map;
  }

  /** 高速intent判定パターンを連結 */
  getFastIntents(): FastIntentMatch[] {
    const matches: FastIntentMatch[] = [];
    for (const skill of this.skills.values()) {
      if (skill.fastIntents) matches.push(...skill.fastIntents);
    }
    return matches;
  }

  /** intent → handler のマップ */
  getIntentHandlerMap(): Map<string, SkillHandler> {
    const map = new Map<string, SkillHandler>();
    for (const route of this.getKeywordRoutes()) {
      if (!map.has(route.intent)) {
        map.set(route.intent, route.handler);
      }
    }
    return map;
  }

  /** detectIntentプロンプト用のカテゴリ説明を連結 */
  getIntentDescriptions(): Record<string, string> {
    const descs: Record<string, string> = {};
    for (const skill of this.skills.values()) {
      if (skill.intentDescriptions) {
        Object.assign(descs, skill.intentDescriptions);
      }
    }
    return descs;
  }

  /** break pattern用キーワードを連結 */
  getBreakKeywords(): string[] {
    const kws: string[] = [];
    for (const skill of this.skills.values()) {
      if (skill.breakKeywords) kws.push(...skill.breakKeywords);
    }
    return kws;
  }

  // ── ai-agent.ts 用 ──

  /** Gemini Function Calling用のツール宣言配列 */
  getAgentToolDeclarations(): any[] {
    const decls: any[] = [];
    for (const skill of this.skills.values()) {
      if (skill.agentTools) {
        for (const tool of skill.agentTools) {
          decls.push({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          });
        }
      }
    }
    return decls;
  }

  /** ツール名 → execute関数のマップ */
  getAgentToolExecutors(): Map<string, (args: any, supabase: any, userId: string) => Promise<string>> {
    const map = new Map<string, (args: any, supabase: any, userId: string) => Promise<string>>();
    for (const skill of this.skills.values()) {
      if (skill.agentTools) {
        for (const tool of skill.agentTools) {
          map.set(tool.name, tool.execute);
        }
      }
    }
    return map;
  }

  // ── patterns.ts 用 ──

  /** ブリーフィング提供者をorder順にソートして返す */
  getBriefingProviders(): BriefingProvider[] {
    const providers: BriefingProvider[] = [];
    for (const skill of this.skills.values()) {
      if (skill.briefing) providers.push(skill.briefing);
    }
    return providers.sort((a, b) => a.order - b.order);
  }

  /** 全intentsを連結 */
  getAllIntents(): string[] {
    const intents = new Set<string>();
    for (const skill of this.skills.values()) {
      for (const intent of skill.intents) {
        intents.add(intent);
      }
    }
    return [...intents];
  }

  /** 登録済みスキル数 */
  get size(): number {
    return this.skills.size;
  }
}

export const skillRegistry = new SkillRegistry();
