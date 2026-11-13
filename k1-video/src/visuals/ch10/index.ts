import type React from 'react';
import {ClaimCheck} from './ClaimCheck';
import {Closing} from './Closing';
import {DailyActions} from './DailyActions';
import {LearnFrame} from './LearnFrame';

/** 第10章 固有の図解コンポーネント（キーは scene-data の visual に書く名前） */
export const ch10Visuals: Record<string, React.FC<any>> = {
  'ch10/ClaimCheck': ClaimCheck,
  'ch10/LearnFrame': LearnFrame,
  'ch10/DailyActions': DailyActions,
  'ch10/Closing': Closing,
};
