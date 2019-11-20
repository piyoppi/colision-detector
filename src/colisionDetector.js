export default class colisionDetector {
  constructor(fieldWidth, fieldHeight, level, items = null){
    this._fieldWidth = fieldWidth;
    this._fieldHeight = fieldHeight;
    this._level = level;
    this._linearQuaternaryTree = [];

    this._groupDetails = new Map();         //key: object, value: groupId
    this._groupList = new Map();            //key: groupId, value: object
    this._maxGroupId = 0;
    this._numberingColisionIdCounter = 0;

    this._makeLinearQuaternaryTree();
    if( items ){
      items.forEach( item => this.updateTree(item) );
    }
    this.length = 0;

    this.putColisionStateHook = null;
  }

  get groupList() {
    return this._groupList;
  }

  /**
   * Initialize the tree
   */
  _makeLinearQuaternaryTree(){
    const cycle = ( Math.pow(4, this._level+1)-1.0 ) / 3.0;
    for( let i=0; i<cycle; i++ ){
      this._linearQuaternaryTree.push({items: {}});
    }
    const lowestLevelCellCount = Math.pow( 2, this._level );
    this._lowLevelCellSize = [ this._fieldWidth / lowestLevelCellCount, this._fieldHeight / lowestLevelCellCount ];
  }

  /**
   * Remove item in the tree
   *
   * @param {Object} item
   */
  removeFromMortonTree(item) {
    this.updateTree(item, true);
  }

  /**
   *  Update Tree
   *
   *  @param {Boolean} isRemoveOnly
   */
  updateTree(item, isRemoveOnly = false){
    let area = this._convToAreaNumber(item);
    let treeIdx;

    if( item.position[0] < 0 || item.position[1] < 0 ||
        (item.position[0] + item.width) > this._fieldWidth || (item.position[1] + item.height) > this._fieldHeight ) {
      treeIdx = 0;
    } else {
      treeIdx = area ? area.areaNumber + ((Math.pow(4, area.level)-1.0 ) / 3.0) : 0;
    }

    if( !item.colisionState ) {
      item.colisionState = {
        isGround: false,
        ignoreItemIds: [],
        colisions: [],
        treeIndex: -1
      }
    }

    if( item.colisionState.treeIndex === treeIdx && !isRemoveOnly ) return;
    if( this._linearQuaternaryTree.length <= treeIdx ) return;

    let node = this._linearQuaternaryTree[treeIdx];
    let registeredNode = this._linearQuaternaryTree[item.colisionState.treeIndex];

    // remove registersd the item when the item is already exist
    if( registeredNode && item.colisionState.colisionId in registeredNode.items ){
      let regNodeItem = registeredNode.items[item.colisionState.colisionId];
      if( regNodeItem.next === null && regNodeItem.prev === null ){
        registeredNode.headItemID = null;
      }
      if( regNodeItem.prev !== null && registeredNode.items[regNodeItem.prev] ){
        registeredNode.items[regNodeItem.prev].next = regNodeItem.next;
        if( regNodeItem.next === null ) registeredNode.headItemID = regNodeItem.prev;
      }
      if( regNodeItem.next !== null && registeredNode.items[regNodeItem.next] ){
        registeredNode.items[regNodeItem.next].prev = regNodeItem.prev;
      }
      registeredNode.length--;
      this.length--;
      delete registeredNode.items[item.colisionState.colisionId];
    }

    if( isRemoveOnly ) return;

    let settingId;
    if ((typeof item.colisionState.colisionId !== 'undefined') || (item.colisionState.colisionId < 0)) {
      settingId = item.colisionState.colisionId;
    } else {
      settingId = this._numberingColisionIdCounter++;
      item.colisionState.colisionId = settingId;
    }

    // add item to node
    if( (node.headItemID === null) || (typeof node.headItemID === 'undefined') ){
      node.items = {};
      node.items[settingId] = {item: item, prev: null, next: null};
      node.length = 1;
    }
    else{
      node.items[node.headItemID].next = settingId;
      node.items[settingId] = {item: item, prev: node.headItemID, next: null};
      node.length++;
    }
    this.length++;
    item.colisionState.treeIndex = treeIdx;
    node.headItemID = settingId;
  }

  clearMetadataFromItem(items) {
    items.forEach( item => {
      item.colisionState.treeIndex = -1;
      item.colisionState.colisionId = -1;
    });
  }

  /**
   *  Detect colision in all areas
   *
   *  @param {Array} items
   */
  detect(items){
    items.forEach( item => {
      item.colisionState.colisions = [];
      item.colisionState.isGround = false;
    });

    this.initializeGroups();

    this._checkTree(0, 0);
  }

  /**
   * Detect colision with an specific rectangle
   *
   * @param {Object} rect rectangle
   */
  detectAt(rect) {
    const area = this._convToAreaNumber(rect);

    // move to upside level
    let retItems = this._checkTreeAt(area.level-1, (area.areaNumber >> 2) & 3, rect, true);

    // move to next level
    retItems = [...retItems, ...this._checkTreeAt(area.level, area.areaNumber, rect, false)];

    return retItems;
  }

  /**
   * Detect colision with an specific rectangle
   * (uses: detecting click)
   *
   * @param {Number} level
   * @param {Number} areaNumber the number of a area
   * @param {Object} specificRect rectangle
   * @param {Boolean} isUpTree
   */
  _checkTreeAt(level, areaNumber, specificRect, isUpTree) {
    const idxQuaternaryTree = ((Math.pow(4, level)-1.0 ) / 3.0) + areaNumber;
    if( idxQuaternaryTree < 0 ) return [];

    let procMortonNode = this._linearQuaternaryTree[idxQuaternaryTree];
    let hitItems = [];
    if( !procMortonNode ) return [];

    let currentMortonNodeItem = procMortonNode.items[procMortonNode.headItemID];
    while(true){
      if( currentMortonNodeItem ){
        if( this._isColision(specificRect, currentMortonNodeItem.item) ){
          hitItems.push(currentMortonNodeItem.item);
        }
        currentMortonNodeItem = procMortonNode.items[currentMortonNodeItem.prev];
      }
      else{
        break;
      }
    }

    if( isUpTree ){
      // move to upside level
      hitItems = [...hitItems, ...this._checkTreeAt(level - 1, (areaNumber >> 2) & 3, specificRect, isUpTree)];
    } else {
      // move to next level
      for( let j = 0; j < 4; j++ ){
        hitItems = [...hitItems, ...this._checkTreeAt(level + 1, 4 * areaNumber + j, specificRect, isUpTree)];
      }
    }

    return hitItems;
  }


  /**
   * Colision detection using tree
   * 
   * @params {Number} level tree level
   * @params {Number} areaNumber area number in the level
   * @params {Array} parentItems
   */
  _checkTree(level, areaNumber, parentItems = []){
    const idxQuaternaryTree = ((Math.pow(4, level)-1.0 ) / 3.0) + areaNumber;
    const procMortonNode = this._linearQuaternaryTree[idxQuaternaryTree];
    const beforeParentCount = parentItems.length;
    if( !procMortonNode ) return;

    for (let itemID in procMortonNode.items) {
      let procMortonNodeItem = procMortonNode.items[itemID];

      // Colision detection of same area
      let currentMortonNodeItem = procMortonNode.items[procMortonNodeItem['next']];
      while(true){
        if( currentMortonNodeItem ){
          if( !(procMortonNodeItem.item.pin && currentMortonNodeItem.item.pin) ) {
            const isColision = this._isColision(procMortonNodeItem.item, currentMortonNodeItem.item);
            if( isColision ) {
              this._putColisionDetailToItem(procMortonNodeItem.item, currentMortonNodeItem.item);
              this._makeColisionGroups(procMortonNodeItem.item, currentMortonNodeItem.item);
            }
          }
          currentMortonNodeItem = procMortonNode.items[currentMortonNodeItem.next];
        }
        else{
          break;
        }
      }

      // Colision detection of parent nodes
      for( let n=0; n<parentItems.length; n++ ){
        if( procMortonNodeItem.item.pin && parentItems[n].pin ) continue;
        const isColision = this._isColision(procMortonNodeItem.item, parentItems[n]);
        if( isColision ) {
          this._putColisionDetailToItem(procMortonNodeItem.item, parentItems[n]);
          this._makeColisionGroups(procMortonNodeItem.item, parentItems[n]);
        }
      }
    }

    for (let itemID in procMortonNode['items']) {
      parentItems.push(procMortonNode.items[itemID].item);
    }

    for( let j=0; j<4; j++ ){
      this._checkTree(level + 1, 4 * areaNumber + j, parentItems);
    }

    parentItems.splice(beforeParentCount, parentItems.length - beforeParentCount);
  }

  /**
   * Initialize colision groups
   */
  initializeGroups() {
    this._groupDetails.clear();
    this._groupList.clear();
    this._maxGroupId = 0;
  }

  /**
   * Make colision groups
   *
   * @param {Object} item1
   * @param {Object} item2
   */
  _makeColisionGroups(item1, item2) {
    const hasItem1 = this._groupDetails.has(item1.colisionState.colisionId) && (this._groupDetails.get(item1.colisionState.colisionId) != null);
    const hasItem2 = this._groupDetails.has(item2.colisionState.colisionId) && (this._groupDetails.get(item1.colisionState.colisionId) != null);

    if( !hasItem1 && !hasItem2 ) {
      this._maxGroupId++;
      this._groupDetails.set(item1, this._maxGroupId);
      this._groupDetails.set(item2, this._maxGroupId);
      this._groupList.set(this._maxGroupId, [item1, item2]);
    } else if( hasItem1 && hasItem2 ) {
      let item1Group = this._groupDetails.get(item1.colisionState.colisionId);
      let item2Group = this._groupDetails.get(item2.colisionState.colisionId);
      let replaceGroupId, groupId;

      if( item1Group > item2Group ) {
        replaceGroupId = this._groupDetails.get(item1.colisionState.colisionId);
        groupId = this._groupDetails.get(item2.colisionState.colisionId);
      } else {
        replaceGroupId = this._groupDetails.get(item2.colisionState.colisionId);
        groupId = this._groupDetails.get(item1.colisionState.colisionId);
      }

      this._groupList.get(replaceGroupId).forEach( item => this._groupDetails.set(item, groupId) );
      this._groupList.delete(groupId);
    } else {
      if( hasItem1 && !hasItem2 && this._groupDetails.get(item1.colisionState.colisionId) ) {
        let item1Group = this._groupDetails.get(item1.colisionState.colisionId);
        this._groupDetails.set(item2, item1Group);
        this._groupList.get(item1Group).push(item2);
      } else {
        let item2Group = this._groupDetails.get(item2.colisionState.colisionId);
        this._groupDetails.set(item1, item2Group);
        this._groupList.get(item2Group).push(item1);
      }
    }
  }

  /**
   * Colision detection
   *
   * @param {Object} item1
   * @param {Object} item2
   */
  _isColision(item1, item2){
    return (item1.position[0] <= (item2.position[0] + item2.width) ) &&
      (item2.position[0] <= (item1.position[0] + item1.width) ) && 
      (item1.position[1] <= (item2.position[1] + item2.height) ) && 
      (item2.position[1] <= (item1.position[1] + item1.height) );
  }

  _putColisionDetailToItem(item1, item2) {
    let distX = ( item1.position[0] < item2.position[0] ) ? (item1.position[0] + item1.width - item2.position[0]) : -(item2.position[0] + item2.width - item1.position[0]);
    let distY = ( item1.position[1] < item2.position[1] ) ? (item1.position[1] + item1.height - item2.position[1]) : -(item2.position[1] + item2.height - item1.position[1]);
    let normVec = [distX > 0 ? 1 : -1, distY > 0 ? 1 : -1];          //衝突オブジェクトから見た衝突面の法線ベクトル（基準座標は物体毎に存在）
    let absdistX = distX < 0 ? -distX : distX;
    let absdistY = distY < 0 ? -distY : distY;
    if( (absdistX > item1.width / 2) || (absdistX > item2.width / 2) ) distX = 0;
    if( (absdistY > item1.height / 2) || (absdistY > item2.height / 2) ) distY = 0;
    if( !distX || (absdistX > absdistY) ) normVec[0] = 0;
    if( !distY || (absdistX < absdistY) ) normVec[1] = 0;
    let inverseNormVec = [
      normVec[0] === 0 ? 0 : -normVec[0],
      normVec[1] === 0 ? 0 : -normVec[1]
    ];

    const colisionState1 = {
      pair: item2,
      distX: distX,
      distY: distY,
      absDistX: absdistX,
      absDistY: absdistY,
      colisionFaceVec: normVec,
    };
    item1.colisionState.colisions.push(colisionState1);

    const colisionState2 = {
      pair: item1,
      distX: distX === 0 ? 0 : -distX,
      distY: distY === 0 ? 0 : -distY,
      absDistX: absdistX,
      absDistY: absdistY,
      colisionFaceVec: inverseNormVec,
    };
    item2.colisionState.colisions.push(colisionState2);

    if( this.putColisionStateHook ) {
      this.putColisionStateHook(item1, item2, colisionState1, colisionState2);
    }
  }

  /**
   * Convert grid position to the tree number
   */
  _convPositionToGridNumber(position){
    let n = position[0];
    let m = position[1];
    n = (n | (n<<8)) & 16711935;
    n = (n | (n<<4)) & 252645135;
    n = (n | (n<<2)) & 858993459;
    n = (n | (n<<1)) & 1431655765;
    m = (m | (m<<8)) & 16711935;
    m = (m | (m<<4)) & 252645135;
    m = (m | (m<<2)) & 858993459;
    m = (m | (m<<1)) & 1431655765;
    return n | (m << 1);
  }

  _convToAreaNumber(item){
    const itemPosition = [ [Math.floor((item.position[0]) / this._lowLevelCellSize[0]), Math.floor((item.position[1]) / this._lowLevelCellSize[1])],
      [Math.floor((item.position[0] + item.width) / this._lowLevelCellSize[0]), Math.floor((item.position[1] + item.height) / this._lowLevelCellSize[1])] ];
    const cornerMortonNum = [this._convPositionToGridNumber(itemPosition[0]), this._convPositionToGridNumber(itemPosition[1])];
    const shiftNumber = cornerMortonNum[0] ^ cornerMortonNum[1];
    if( shiftNumber < 0 ) return null;
    const shiftAmont = (shiftNumber === 0) ? 0 : (Math.floor( Math.log(shiftNumber) / Math.log(4) ) + 1) * 2;
    let level = this._level - Math.floor(shiftAmont / 2.0);
    let areaNum = (cornerMortonNum[1] >> shiftAmont);

    if( areaNum < 0 || level < 0 ) {
      areaNum = 0;
      level = 0;
    }

    return {
      areaNumber: areaNum,
      level: level
    };
  }
}
