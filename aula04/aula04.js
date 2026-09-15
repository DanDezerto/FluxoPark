//construção de objetos
const obj = {
    att1: "valor1",
    att2: "valor2"
}

console.log(obj);

//arrays são dinamicos e podem receber atributos de tipos diferentes
let arr = [1, "abc", {att: 1, att: 2}];
console.log(arr);

//desconstrução de objetos
const{att1, att2} = obj;
console.log(att1);
console.log(att2);