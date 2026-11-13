import React from 'react';
import {Composition, Folder} from 'remotion';
import {K1Video, K1VideoProps, totalFrames} from './compositions/K1Video';
import {CHAPTERS} from './data/chapters';
import {ensureFonts} from './fonts';
import {VIDEO} from './theme';

ensureFonts();

/**
 * Composition 一覧
 *  - K1-Full          全編（字幕あり）
 *  - K1-Full-NoSub    全編（字幕なし）
 *  - K1-Ch00〜Ch10    章ごと（字幕あり。--props='{"showCaptions":false}' で字幕なし）
 *  - K1-Scene         シーン単体（--props='{"sceneIds":["c03-s02"]}'）
 */
export const RemotionRoot: React.FC = () => {
  const base = {width: VIDEO.width, height: VIDEO.height, fps: VIDEO.fps};
  return (
    <>
      <Folder name="Full">
        <Composition<any, K1VideoProps>
          id="K1-Full"
          component={K1Video}
          {...base}
          durationInFrames={totalFrames({}, VIDEO.fps)}
          defaultProps={{showCaptions: true}}
          calculateMetadata={({props}) => ({durationInFrames: totalFrames(props, VIDEO.fps)})}
        />
        <Composition<any, K1VideoProps>
          id="K1-Full-NoSub"
          component={K1Video}
          {...base}
          durationInFrames={totalFrames({}, VIDEO.fps)}
          defaultProps={{showCaptions: false}}
        />
      </Folder>
      <Folder name="Chapters">
        {CHAPTERS.map((c) => (
          <Composition<any, K1VideoProps>
            key={c.id}
            id={`K1-${c.slug}`}
            component={K1Video}
            {...base}
            durationInFrames={totalFrames({chapterIds: [c.id]}, VIDEO.fps)}
            defaultProps={{chapterIds: [c.id], showCaptions: true}}
            calculateMetadata={({props}) => ({durationInFrames: totalFrames(props, VIDEO.fps)})}
          />
        ))}
      </Folder>
      <Folder name="Preview">
        <Composition<any, K1VideoProps>
          id="K1-Scene"
          component={K1Video}
          {...base}
          durationInFrames={totalFrames({sceneIds: ['c00-s01']}, VIDEO.fps)}
          defaultProps={{sceneIds: ['c00-s01'], showCaptions: true}}
          calculateMetadata={({props}) => ({durationInFrames: totalFrames(props, VIDEO.fps)})}
        />
      </Folder>
    </>
  );
};
