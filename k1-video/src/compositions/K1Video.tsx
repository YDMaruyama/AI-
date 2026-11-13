import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {SceneRenderer} from '../components/SceneRenderer';
import {CHAPTERS} from '../data/chapters';
import type {Chapter, Scene} from '../data/types';
import {COLORS} from '../theme';
import {sceneFrames} from '../timeline';

export type K1VideoProps = {
  /** 対象の章 ID（省略時は全章） */
  chapterIds?: string[];
  /** 対象のシーン ID（単体プレビュー用） */
  sceneIds?: string[];
  showCaptions: boolean;
  withAudio?: boolean;
};

export const TOTAL_CHAPTERS = CHAPTERS.filter((c) => c.number > 0).length;

export const selectScenes = (props: Pick<K1VideoProps, 'chapterIds' | 'sceneIds'>) => {
  const items: {chapter: Chapter; scene: Scene}[] = [];
  for (const chapter of CHAPTERS) {
    if (props.chapterIds && !props.chapterIds.includes(chapter.id)) continue;
    for (const scene of chapter.scenes) {
      if (props.sceneIds && !props.sceneIds.includes(scene.id)) continue;
      items.push({chapter, scene});
    }
  }
  return items;
};

export const totalFrames = (props: Pick<K1VideoProps, 'chapterIds' | 'sceneIds'>, fps: number) =>
  Math.max(1, selectScenes(props).reduce((sum, {scene}) => sum + sceneFrames(scene.id, fps), 0));

export const K1Video: React.FC<K1VideoProps> = (props) => {
  const {fps} = useVideoConfig();
  const items = selectScenes(props);
  let from = 0;
  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      {items.map(({chapter, scene}, i) => {
        const dur = sceneFrames(scene.id, fps);
        const prev = items[i - 1];
        const same = !!prev && prev.chapter.id === chapter.id && prev.scene.heading === scene.heading;
        const el = (
          <Sequence key={scene.id} from={from} durationInFrames={dur} name={`${scene.id} ${scene.title}`}>
            <SceneRenderer
              chapter={chapter}
              scene={scene}
              showCaptions={props.showCaptions}
              sameHeadingAsPrev={same}
              totalChapters={TOTAL_CHAPTERS}
              withAudio={props.withAudio ?? true}
            />
          </Sequence>
        );
        from += dur;
        return el;
      })}
    </AbsoluteFill>
  );
};
