export const truncateString =(letter,count)=>{
   if(letter.length > count){
    return letter.slice(0,count) + '...'
   }
   return letter
}
