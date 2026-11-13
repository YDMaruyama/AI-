import type React from 'react';
import {ActionVsHarm} from './ActionVsHarm';
import {CheckQuestions} from './CheckQuestions';
import {CountCompare} from './CountCompare';
import {EDDefinition} from './EDDefinition';
import {Goal} from './Goal';
import {MaterialSplit} from './MaterialSplit';
import {NameCheck} from './NameCheck';
import {Observations} from './Observations';
import {ParticleTraits} from './ParticleTraits';
import {PlasticLink} from './PlasticLink';
import {SizeScale} from './SizeScale';
import {ThemeIntro} from './ThemeIntro';

/** 第04章 固有の図解コンポーネント（キーは scene-data の visual に書く名前） */
export const ch04Visuals: Record<string, React.FC<any>> = {
  'ch04/Observations': Observations,
  'ch04/CheckQuestions': CheckQuestions,
  'ch04/NameCheck': NameCheck,
  'ch04/ThemeIntro': ThemeIntro,
  'ch04/Goal': Goal,
  'ch04/SizeScale': SizeScale,
  'ch04/ParticleTraits': ParticleTraits,
  'ch04/CountCompare': CountCompare,
  'ch04/EDDefinition': EDDefinition,
  'ch04/ActionVsHarm': ActionVsHarm,
  'ch04/PlasticLink': PlasticLink,
  'ch04/MaterialSplit': MaterialSplit,
};
