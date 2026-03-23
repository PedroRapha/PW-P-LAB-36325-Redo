requestAnimationFrame("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.SERVER_PORT || 3000;

/*  ----------------------------------
    ------EXEMPLO - CRUD com Mock-----
    ---------------------------------- */

let users = [
    { id: 1, name: "Ana", email: "ana@email.com" },
    { id: 2, name: "João", email: "joao@email.com" }
];

//GET - listar todos

app.get("/users", (req, res)=> {
    res.status(200).json({ data: users });
});

//GET - obter um

app.get("/users/:id", (req, res) => {
    const id = parseInt(req.params.ud);
    const user = users.find((u) => u.id === id);

    if(!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    res.status(200).json({ data: user });
})

//POST - Criar
app.post("/users", (req, res) => {
    const { name, email } = req.body;

    //validação
    if (!name || email) {
        return res.status(400).json({ message: "Campos 'name' e 'email' são obrigatórios" });
    }

    const newUser = {
        id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
        name,
        email
    }

    users.push(newUser);
    res.status(201).json({ data: newUser });
});

//PUT - Atualizar

app.put("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Utilizador não encontrado" }),
    }

    const { name, email} = req.body;

    if(!name || !email) {
        return res.status(400).json({ message: "camos 'name' e 'email' são obrigatórios" });
    }
});

//DELETE - Apagar



//Middleware de Erros
app.use((req,res) => {
    res.status(404).json({ message: "Rota não encontrada" });
});
//Middleware de erro global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Erro interno do servidor" });
});

//Iniciar o servidor:
app.listen(PORT, () => {
    console.log(`✅ Servidor a correr em http://localhost:${PORT}`);
});