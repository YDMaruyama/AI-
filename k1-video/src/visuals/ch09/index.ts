import type React from 'react';
import {BoardCheck} from './BoardCheck';
import {BoardScrape} from './BoardScrape';
import {ContainerHeat} from './ContainerHeat';
import {ContainerLid} from './ContainerLid';
import {DailyCheck} from './DailyCheck';
import {PanSplit} from './PanSplit';
import {SoftenerCapsule} from './SoftenerCapsule';
import {SoftenerChoice} from './SoftenerChoice';
import {SoftenerSeparate} from './SoftenerSeparate';
import {UseRisks} from './UseRisks';
import {WoodOption} from './WoodOption';

/** 第9章 固有の図解コンポーネント */
export const ch09Visuals: Record<string, React.FC<any>> = {
  'ch09/UseRisks': UseRisks,
  'ch09/ContainerHeat': ContainerHeat,
  'ch09/ContainerLid': ContainerLid,
  'ch09/BoardScrape': BoardScrape,
  'ch09/BoardCheck': BoardCheck,
  'ch09/WoodOption': WoodOption,
  'ch09/PanSplit': PanSplit,
  'ch09/SoftenerCapsule': SoftenerCapsule,
  'ch09/SoftenerSeparate': SoftenerSeparate,
  'ch09/SoftenerChoice': SoftenerChoice,
  'ch09/DailyCheck': DailyCheck,
};
