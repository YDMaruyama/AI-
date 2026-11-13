import type React from 'react';
import {ch00Visuals} from './ch00';
import {ch01Visuals} from './ch01';
import {ch02Visuals} from './ch02';
import {ch03Visuals} from './ch03';
import {ch04Visuals} from './ch04';
import {ch05Visuals} from './ch05';
import {ch06Visuals} from './ch06';
import {ch07Visuals} from './ch07';
import {ch08Visuals} from './ch08';
import {ch09Visuals} from './ch09';
import {ch10Visuals} from './ch10';
import {templates} from './templates';

/**
 * 図解コンポーネントの登録表。scene-data の visual はここのキーを指す。
 * 章固有のものは「chXX/名前」の形で登録する（例: 'ch03/SkinBoundary'）。
 */
export const VISUALS: Record<string, React.FC<any>> = {
  ...templates,
  ...ch00Visuals,
  ...ch01Visuals,
  ...ch02Visuals,
  ...ch03Visuals,
  ...ch04Visuals,
  ...ch05Visuals,
  ...ch06Visuals,
  ...ch07Visuals,
  ...ch08Visuals,
  ...ch09Visuals,
  ...ch10Visuals,
};
