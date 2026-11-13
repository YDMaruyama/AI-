import type React from 'react';
import {AvoidPrevent} from './AvoidPrevent';
import {ExposureFactors} from './ExposureFactors';
import {ExposureWord} from './ExposureWord';
import {IconCards} from './IconCards';
import {KnowReview} from './KnowReview';
import {RouteLanes} from './RouteLanes';
import {SkinBoundary} from './SkinBoundary';

/** 第3章 固有の図解コンポーネント */
export const ch03Visuals: Record<string, React.FC<any>> = {
  'ch03/ExposureFactors': ExposureFactors,
  'ch03/KnowReview': KnowReview,
  'ch03/IconCards': IconCards,
  'ch03/AvoidPrevent': AvoidPrevent,
  'ch03/ExposureWord': ExposureWord,
  'ch03/RouteLanes': RouteLanes,
  'ch03/SkinBoundary': SkinBoundary,
};
