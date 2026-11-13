import type React from 'react';
import {CapsuleMechanism, CapsuleShell} from './Capsule';
import {CapsuleExposure} from './CapsuleExposure';
import {FragranceChecks, ScentChoice} from './Choices';
import {DetectionLimits} from './DetectionLimits';
import {DustSources, FiberCompare} from './Dust';
import {DustRoutes} from './DustRoutes';
import {FoodRoutes} from './FoodRoutes';
import {ParticleOrChemical, SkinProducts} from './Skin';
import {UtensilRelease} from './UtensilRelease';

/** 第05章 固有の図解コンポーネント（キーは scene-data の visual に書く名前） */
export const ch05Visuals: Record<string, React.FC<any>> = {
  'ch05/FoodRoutes': FoodRoutes,
  'ch05/DetectionLimits': DetectionLimits,
  'ch05/UtensilRelease': UtensilRelease,
  'ch05/DustSources': DustSources,
  'ch05/FiberCompare': FiberCompare,
  'ch05/DustRoutes': DustRoutes,
  'ch05/SkinProducts': SkinProducts,
  'ch05/ParticleOrChemical': ParticleOrChemical,
  'ch05/CapsuleMechanism': CapsuleMechanism,
  'ch05/CapsuleShell': CapsuleShell,
  'ch05/CapsuleExposure': CapsuleExposure,
  'ch05/FragranceChecks': FragranceChecks,
  'ch05/ScentChoice': ScentChoice,
};
