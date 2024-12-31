import * as YAML from "js-yaml";
import { ExtensionType, extensions } from "pixi.js";

export const loader = {
  extension: {
    type: ExtensionType.LoadParser,
    name: 'yaml-loader',
    priority: 10,
  },
  test(url) {
    return /\.yaml$|\.txt$/.test(url);
  },
  async load(url) {
    let data = await fetch(url, { encoding:"utf-8" });
    let target = await data.text();
    let targetData = YAML.load(target)
    return targetData;
  },
}



extensions.add(loader);

