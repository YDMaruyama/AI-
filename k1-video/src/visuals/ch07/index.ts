import type React from 'react';
import {ProfileGrid} from './ProfileGrid';
import {SubstanceProfile} from './SubstanceProfile';

/** 第07章 固有の図解コンポーネント（キーは scene-data の visual に書く名前） */
export const ch07Visuals: Record<string, React.FC<any>> = {
  'ch07/SubstanceProfile': SubstanceProfile,
  'ch07/ProfileGrid': ProfileGrid,
};
