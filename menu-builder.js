const fs = require('fs');

//
// Config
//

const N = 10;       // first level items
const M = 25;       // second level items
const L = 50;       // third level items

const output = './result.json';


//
// Test data generation
//

function * testDataGenerator(n, m, l) {
  let id = 0;
  for (let i = 0, parentI; i < n; i++) {
    parentI = id;
    yield ({ id: id++, parent: null, title: `top level ${i}` });
    for (let j = 0, parentJ; j < m; j++) {
      parentJ = id;
      yield ({ id: id++, parent: parentI, title: `2nd level ${j}` });
      for (let k = 0; k < l; k++) {
        yield ({ id: id++, parent: parentJ, title: `3rd level ${k}` });
      }
    }
  }
}


//
// I/O and logging
//

const effects = (function () {
  let ops = 0;
  return {
    start() { console.time('job') },

    logOp() { ops++ },

    stop() {
      console.timeEnd('job');
      console.log('%d entry processed', ops);
    },

    fetch() {
      return [...testDataGenerator(N, M, L)];
    },

    post(menu) {
      const data = JSON.stringify(menu, null, '  ');
      fs.writeFileSync(output, data, 'utf8');
    }
  }
}());


//
// implementation
//

const groupByParent = (groups, { parent }, index) => {
  if (parent === null) {
    return groups;
  }
  if (!groups.has(parent)) {
    groups.set(parent, []);
  }
  groups.get(parent).push(index);
  return groups;
};

function buildMenu(items) {
  const byParentGroups = items.reduce(groupByParent, new Map());
  return items
    .map(item => ({ ...item, children: [] }))
    .reduce((menu, item, index, allItems) => {
      effects.logOp();
      const { id, parent } = item;
      if (byParentGroups.has(id)) {
        item.children = byParentGroups.get(id).map(childId => allItems[childId]);
      }
      if (parent === null) {
        menu.push(item);
      }
      return menu;
    }, []);
}


//
// usage
//

(function () {
  const items = effects.fetch();
  effects.start();
  const menu = buildMenu(items);
  effects.stop();
  effects.post(menu);
}());
