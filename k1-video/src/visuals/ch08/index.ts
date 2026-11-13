import type React from 'react';
import {EvidenceBoard} from './EvidenceBoard';
import {HormoneRoles} from './HormoneRoles';
import {ImmuneBalance} from './ImmuneBalance';
import {IndicatorMeaning} from './IndicatorMeaning';
import {NotLumping} from './NotLumping';
import {NowSummary} from './NowSummary';
import {ParticleConditions} from './ParticleConditions';
import {ParticleReaction} from './ParticleReaction';
import {PfasAssociations} from './PfasAssociations';
import {StudyAreas} from './StudyAreas';

/** 第08章 固有の図解コンポーネント（キーは scene-data の visual に書く名前） */
export const ch08Visuals: Record<string, React.FC<any>> = {
  'ch08/StudyAreas': StudyAreas,
  'ch08/ParticleReaction': ParticleReaction,
  'ch08/ParticleConditions': ParticleConditions,
  'ch08/HormoneRoles': HormoneRoles,
  'ch08/EvidenceBoard': EvidenceBoard,
  'ch08/ImmuneBalance': ImmuneBalance,
  'ch08/PfasAssociations': PfasAssociations,
  'ch08/IndicatorMeaning': IndicatorMeaning,
  'ch08/NowSummary': NowSummary,
  'ch08/NotLumping': NotLumping,
};
