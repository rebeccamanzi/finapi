const express = require("express");
const req = require("express/lib/request");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware -> funções entre request e response
// Next -> prosseguir para o restante da requisição caso passe com sucesso pelo middleware
/* Utilização: 
    1 - Como 2 arg da rota (caso seja um middleware específico para a rota)
    app.get("/statement/:cpf", verifyIfExistsAccountCPF, (request, response) => {...
    
    2 - Utilizando o app.use (caso o middleware seja utilizado em mais rotas)
    app.use(verifyIfExistsAccountCPF);
*/
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.params;

    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({error: "Customer not found"})
    }

    // Disponibilizar o customer para o método que chamar este middleware
    request.customer = customer;

    return next();
}

// Criar uma conta
app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    // Verificar se já existe um usuário com o cpf informado
    const custumerAlredyExists = customers.some(
        (customer) => customer.cpf === cpf);

    if (custumerAlredyExists) {
        return response.status(400).json({error: "Customer alredy Exists!"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send();
});

// app.use(verifyIfExistsAccountCPF);

// Buscar o extrato bancário do cliente
app.get("/statement/:cpf", verifyIfExistsAccountCPF, (request, response) => {
    const {customer} = request;
    return response.json(customer.statement);
});

app.listen(3333);