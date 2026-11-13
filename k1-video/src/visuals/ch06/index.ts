import type React from 'react';
import {DoseReading} from './DoseReading';
import {HormoneFactors} from './HormoneFactors';
import {HormoneRoles} from './HormoneRoles';
import {HormoneSignal} from './HormoneSignal';
import {MixtureEval} from './MixtureEval';
import {TimingWindow} from './TimingWindow';

/** 第6章 固有の図解コンポーネント */
export const ch06Visuals: Record<string, React.FC<any>> = {
  'ch06/HormoneRoles': HormoneRoles,
  'ch06/HormoneFactors': HormoneFactors,
  'ch06/HormoneSignal': HormoneSignal,
  'ch06/TimingWindow': TimingWindow,
  'ch06/DoseReading': DoseReading,
  'ch06/MixtureEval': MixtureEval,
};
