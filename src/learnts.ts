export type backendType = {id: number, name: string}
export type desireFrontendType = {userId: number, newName: string, age?: number}


const classPornHigh = [{id: 1, name: 'Bin'}, {id: 38, name: 'Portugal'}]


const changeArrType = classPornHigh.map((item: backendType ) => {
  return {
    userId: item.id,
    newName: item.name,
    age: 0
  }
})

console.log(changeArrType)
