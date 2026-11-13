import type React from 'react';
import {KeepChoosing} from './KeepChoosing';
import {ViewPanel} from './ViewPanel';
import {ViewsExtend} from './ViewsExtend';

/** 第02章 固有の図解コンポーネント（キーは scene-data の visual に書く名前） */
export const ch02Visuals: Record<string, React.FC<any>> = {
  'ch02/ViewPanel': ViewPanel,
  'ch02/ViewsExtend': ViewsExtend,
  'ch02/KeepChoosing': KeepChoosing,
};
