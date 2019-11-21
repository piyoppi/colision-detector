import ColisionDetector from './../src/colisionDetector.js'

describe('#_makeLinearQuaternaryTree', () => {
  it('generate linear quaternary tree when level is 2', () => {
    const colisionDetector = new ColisionDetector(800, 800, 2);
    colisionDetector._makeLinearQuaternaryTree();
    expect(colisionDetector._lowLevelCellSize).toEqual([200, 200]);
  });

  it('generate linear quaternary tree when level is 3', () => {
    const colisionDetector = new ColisionDetector(800, 800, 3);
    colisionDetector._makeLinearQuaternaryTree();
    expect(colisionDetector._lowLevelCellSize).toEqual([100, 100]);
  });
});

describe('#_convPositionToGridNumber', () => {
  const colisionDetector = new ColisionDetector(1000, 1000, 2);
  it('calculate a valid value', () => {
    expect(colisionDetector._convPositionToGridNumber([0, 0])).toEqual(0);
    expect(colisionDetector._convPositionToGridNumber([4, 3])).toEqual(26);
    expect(colisionDetector._convPositionToGridNumber([4, 6])).toEqual(56);
    expect(colisionDetector._convPositionToGridNumber([7, 7])).toEqual(63);
  });
});

describe('#_convToAreaNumber', () => {
  it('calculate a valid number when maximum level is 2', () => {
    const colisionDetector = new ColisionDetector(800, 800, 2);
    expect(colisionDetector._convToAreaNumber({position: [0, 0], width: 30, height: 30})).toEqual({areaNumber: 0, level: 2});
    expect(colisionDetector._convToAreaNumber({position: [401, 401], width: 300, height: 300})).toEqual({areaNumber: 3, level: 1});
    expect(colisionDetector._convToAreaNumber({position: [401, 0], width: 300, height: 300})).toEqual({areaNumber: 1, level: 1});
    expect(colisionDetector._convToAreaNumber({position: [701, 701], width: 30, height: 30})).toEqual({areaNumber: 15, level: 2});
  });

  it('calculate a valid number when maximum level is 3', () => {
    const colisionDetector = new ColisionDetector(800, 800, 3);
    expect(colisionDetector._convToAreaNumber({position: [0, 0], width: 30, height: 30})).toEqual({areaNumber: 0, level: 3});
    expect(colisionDetector._convToAreaNumber({position: [401, 401], width: 300, height: 300})).toEqual({areaNumber: 3, level: 1});
    expect(colisionDetector._convToAreaNumber({position: [401, 0], width: 300, height: 300})).toEqual({areaNumber: 1, level: 1});
    expect(colisionDetector._convToAreaNumber({position: [701, 701], width: 30, height: 30})).toEqual({areaNumber: 63, level: 3});
  });
});

describe('#detectAt', () => {
  it('return the list of colied items', () => {
    const items = [
      {
        position: [100, 100],
        width: 30,
        height: 30,
        colisionState: {}
      },
      {
        position: [120, 120],
        width: 30,
        height: 30,
        colisionState: {}
      }
    ];
    const colisionDetector = new ColisionDetector(800, 800, 2, items);
    expect(colisionDetector.detectAt({position: [110, 110], width: 1, height: 1})).toEqual([items[0]]);
    expect(colisionDetector.detectAt({position: [121, 121], width: 1, height: 1})).toEqual(
      expect.arrayContaining([items[0], items[1]])
    );
    expect(colisionDetector.detectAt({position: [98, 98], width: 1, height: 1})).toEqual([]);
  });
});

describe('#updateTree', () => {
  it('added item to node', () => {
    const colisionDetector = new ColisionDetector(800, 800, 2);

    const item1 = {
      position: [100, 100],
      width: 30,
      height: 30,
      colisionState: {}
    };
    const expectedFirstNode = {
      item: {
        ...item1,
        colisionState: {
          colisionId: 0,
          treeIndex: 5
        }
      },
      prev: null,
      next: null
    }
    colisionDetector.updateTree(item1);
    expect(colisionDetector._linearQuaternaryTree[5]).toEqual({
      headItemID: 0,
      items: {
        '0': expectedFirstNode
      },
      length: 1
    });

    const item2 = {
      position: [101, 101],
      width: 30,
      height: 30,
      colisionState: {}
    };
    const expectedSecondNode = {
      item: {
        ...item2,
        colisionState: {
          colisionId: 1,
          treeIndex: 5
        }
      },
      prev: 0,
      next: null
    }
    colisionDetector.updateTree(item2);
    expect(colisionDetector._linearQuaternaryTree[5]).toEqual({
      headItemID: 1,
      items: {
        '0': {...expectedFirstNode, next: 1},
        '1': expectedSecondNode
      },
      length: 2
    });

    const item3 = {
      position: [102, 102],
      width: 30,
      height: 30,
      colisionState: {}
    };
    const expectedThirdNode = {
      item: {
        ...item3,
        colisionState: {
          colisionId: 2,
          treeIndex: 5
        }
      },
      prev: 1,
      next: null
    }
    colisionDetector.updateTree(item3);
    expect(colisionDetector._linearQuaternaryTree[5]).toEqual({
      headItemID: 2,
      items: {
        '0': {...expectedFirstNode, next: 1},
        '1': {...expectedSecondNode, next: 2},
        '2': expectedThirdNode
      },
      length: 3
    });
  });

  it('moved node', () => {
    const item1 = {
      position: [100, 100],
      width: 30,
      height: 30,
      colisionState: {}
    }
    const colisionDetector = new ColisionDetector(800, 800, 2);
    colisionDetector.updateTree(item1);
    expect(colisionDetector._linearQuaternaryTree[5].length).toEqual(1);

    item1.position[0] = 700;
    colisionDetector.updateTree(item1);
    expect(colisionDetector._linearQuaternaryTree[5].length).toEqual(0);
    expect(colisionDetector._linearQuaternaryTree[10].length).toEqual(1);
  });
});

describe('#detect', () => {
  it('should detect colisions', () => {
    const item1 = {
      position: [100, 100],
      width: 30,
      height: 30,
    }
    const item2 = {
      position: [120, 100],
      width: 30,
      height: 30,
    }

    const colisionDetector = new ColisionDetector(800, 800, 2);
    colisionDetector.updateTree(item1);
    colisionDetector.updateTree(item2);
    colisionDetector.detect([item1, item2]);

    expect(item1.colisionState.colisions).toEqual([
      {
        pair: expect.any(Object),
        distX: 10,
        distY: 0,
        absDistX: 10,
        absDistY: 30,
        colisionFaceVec: [1, 0]
      }
    ]);

    expect(item2.colisionState.colisions).toEqual([
      {
        pair: expect.any(Object),
        distX: -10,
        distY: 0,
        absDistX: 10,
        absDistY: 30,
        colisionFaceVec: [-1, 0]
      }
    ]);
  });
});
