import type {Chapter, NarrationLine, Scene} from './types';

export const lineIdOf = (scene: Scene, index: number) => `${scene.id}-l${index + 1}`;

/** 全シーンを章順に並べる */
export const allScenes = (chapters: Chapter[]): {chapter: Chapter; scene: Scene}[] =>
  chapters.flatMap((chapter) => chapter.scenes.map((scene) => ({chapter, scene})));

/** 字幕・尺計算用の文字数（記号・空白を除く） */
export const spokenLength = (text: string) =>
  text.replace(/[\s「」『』（）()、。・：:！？!?，．,.／/～〜―\-]/g, '').length;

export const lineText = (l: NarrationLine) => l.text;
