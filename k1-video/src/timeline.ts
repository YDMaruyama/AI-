import type {Timeline, TimelineScene} from './data/types';
import timelineJson from './generated/timeline.json';

export const TIMELINE = timelineJson as unknown as Timeline;

export const sec2f = (s: number, fps: number) => Math.round(s * fps);

export const sceneTimeline = (id: string): TimelineScene => {
  const t = TIMELINE.scenes[id];
  if (!t) {
    throw new Error(`timeline.json にシーン ${id} がありません。npm run timeline を実行してください。`);
  }
  return t;
};

export const sceneFrames = (id: string, fps: number) => Math.max(1, sec2f(sceneTimeline(id).duration, fps));
