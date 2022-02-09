
import localforage from 'localforage'
import Model from '../Model';

export const Key = 'qlearning-chrome://dino'
localforage.config({
  name: Key
});
let globalQTable = {}

export function saveDB() {
  localforage.setItem(Key, globalQTable)
}
export function clearDB() {
  globalQTable = {}
  saveDB()
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function indexOfMax(arr) {
  if (arr.length === 0) {
      return -1;
  }
  let max = arr[0];
  let maxIndex = 0;
  for (let i = 1; i < arr.length; i+=1) {
      if (arr[i] > max) {
          maxIndex = i;
          max = arr[i];
      }
  }
  return maxIndex;
}
export default class QNetwork extends Model{
  constructor(actions, states) {
    super(actions, states)
    this.actions = actions; // 0 runing 1 jump
    this.epsilon = 0.5; // greedy
    this.epsilon_decay = 0.001;
    this.currentState = 0;
    this.alpha = 0.2
    this.gamma = 0.9
    this.prevState = '0,0'
    this.preAction = 0
  }
  initActions() {
    return Array.from({length: 2}).map(item => 0)
  }
  async getQArrFromDB() {
    const result =  await localforage.getItem(Key)
    return result
  }

  async init(actionLen) {
    const result = await this.getQArrFromDB()
    console.info(`from indexedDB get qArr(${Object.keys(globalQTable).length})`, result)
    if (result) {
      globalQTable = result
    }
  }
  showQArr() {
    console.info(`>>>>>>> this.qTable(${Object.keys(globalQTable).length}): `)
  }

  predict(inputXs) {
    const inputX = inputXs[0]
    // console.info('q-table >>>> ', globalQTable, inputX)
    return this.think(inputX)
  }

  think(state) {
    this.currentState = globalQTable[state];
    if (!this.currentState) {
      this.currentState = this.initActions()
      globalQTable[state] = this.currentState
    }
    let action = null;
    if (Math.random() < this.epsilon) {
      action = 0  // getRandomInt(0,(this.actions - 1))
    } else {
      action = indexOfMax(this.currentState);
    }
    this.epsilon = this.epsilon - (this.epsilon_decay * this.epsilon);
    return action;
  }

  giveReward(reward, state) {
    const prevState = this.prevState
    const action = this.preAction
    if (reward !== 1) {
      console.info('giveReward >>>>> ', reward, state, prevState, action);
    }
    let curArr = globalQTable[state];
    if (!curArr) {
      curArr = this.initActions()
      globalQTable[state] = curArr
    }
    let prevStateActions = globalQTable[prevState]
    if (!prevStateActions) {
      prevStateActions = this.initActions()
      globalQTable[prevState] = prevStateActions
    }
    const maxQ = Math.max(...curArr);
    const newQ = this.alpha * (this.gamma * maxQ + reward) 
                  + (1 - this.alpha) * prevStateActions[action]
    globalQTable[prevState][action] = newQ.toFixed(3);
    this.prevState = state;
  }
  updateTable() {
    const Keys = Object.keys(globalQTable);
    const trs = Keys.map(key => `<tr>
              <td>${key}</td>
              <td>${globalQTable[key][0]}</td>
              <td>${globalQTable[key][1]}</td>
           </tr>`)
    const tableText = `
     <table>
     <tr>
     <td>State</td>
     <td>running</td>
     <td>jump</td>
     </tr>
     ${
       trs.join('')
     }
     </table>
    `
    document.getElementById('table').innerHTML = tableText
  }
}