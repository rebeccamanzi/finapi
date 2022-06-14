const express = require("express");
const req = require("express/lib/request");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

/* 
    Middleware -> funções entre request e response
    // Next -> prosseguir para o restante da requisição caso passe com sucesso pelo middleware
    Utilização: 
        1 - Como 2 arg da rota (caso seja um middleware específico para a rota)
        app.get("/statement/:cpf", verifyIfExistsAccountCPF, (request, response) => {...
        
        2 - Utilizando o app.use (caso o middleware seja utilizado em mais rotas)
        app.use(verifyIfExistsAccountCPF);
*/
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({error: "Customer not found"})
    }

    // Disponibilizar o customer para o método que chamar este middleware
    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
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

// Buscar o extrato bancário do cliente
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

// Realizar um depósito
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statetmentOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statetmentOperation);

    return response.status(201).send();
});

// Realizar um saque
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;
    
    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return response.status(400).json({error: "Insuficient funds!"})
    }

    const statetmentOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statetmentOperation);
    return response.status(201).send();

});

// Buscar o extrato bancário do cliente por data
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => 
    statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return response.json(customer.statement);
});

// Atualizar dados da conta do cliente
app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
})

// Obter dados da conta do cliente
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    
    return response.json(customer);
})

// Deletar uma conta
app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return response.status(200).json(customers);
})

// Obter o saldo
app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
})


app.listen(3333);