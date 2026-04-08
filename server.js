//imports
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//middleware globais
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.SERVER_PORT || 3000;

//rota de registo(sign up):
app.post("/auth/signup", async (req, res) => {
    const { name, email, password } = req.body;

    //validação
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Campos 'name', 'email' e 'password' são obrigatórios" });
    }

    //duplicado?
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({ message: "Email já registado" });
    }

    //.hash transforma em hash seguro. O 10 aqui é o salt rounds. Quanto maior, mais seguro, mas mais lento. Salt é um tipo de dado que ajuda na encriptação
    const hashedPassword = await bcrypt.hash(password, 10);

    //cria user com a pass encriptada
    const newUser = await prisma.user.create({
        data: { name, email, password: hashedPassword },
    });

    //retorna dados do user sem a password
    res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email:newUser.email,
    });
});

//rota de login (signin)
app.post("/auth/signin", async (req, res) => {
    const { email, password } = req.body;

    //validação de inserção
    if(!email || !password) {
        return res.status(400).json({ message: "Campos 'email' e 'password' são obrigatórios" });
    }

    //valida se email existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user){
        return res.status(401).json({ message: "Credenciais inválidas" });
    }

    //valida se password está correta (é importante não dizer qual credencial está errada)
    const validPassword = await bcrypt.compare(password, user.password);
    if(!validPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
    }

    //gera token
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.status(200).json({ token });
});

//middleware de autenticação:
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido" });
        }
        req.user = user;
        next();
    });
};

/*  ----------------------------------
    ------EXEMPLO - CRUD com Mock-----
    ----------------------------------
*/

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
    const id = parseInt(req.params.id);
    const user = users.find((u) => u.id === id);

    if(!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    res.status(200).json({ data: user });
});

//POST - Criar
app.post("/users", (req, res) => {
    const { name, email } = req.body;

    //validação
    if (!name || !email) {
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
        return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    const { name, email} = req.body;

    if(!name || !email) {
        return res.status(400).json({ message: "Campos 'name' e 'email' são obrigatórios" });
    }

    users[index] = { id, name, email };
    res.status(200).json({ data: users[index] });
});

//DELETE - Apagar

app.delete("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    users.splice(index, 1);
    res.status(200).json({ message: "Utilizador eliminado com sucesso" });
});




/*  ----------------------------------
    --LAB-1 -- API Gestão de Filmes---
    ----------------------------------
*/

let movies = [ { id: 1, title: "Inception", year: 2010 }, { id: 2, title: "Interstellar", year: 2014 } ];

//GET - listar todos

app.get("/movies", (req, res) => {
    res.status(200).json({ data: movies });
});

//GET - obter um

app.get("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const movie = movies.find((findMovie) => findMovie.id === id);

    if(!movie) {
        return res.status(404).json({ message: "Filme não encontrado" });
    }

    res.status(200).json({ data: movie });
});

//POST - Criar

app.post("/movies", (req, res) => {
    const { title, year } = req.body;

    if (!title || !year) {
        return res.status(400).json({ message: "Campos 'title' e 'year' são obrigatórios" })
    }

    const newMovie = {
        id: movies.length > 0 ? movies[movies.length - 1].id + 1 : 1,
        title,
        year
    }

    movies.push(newMovie);
    res.status(201).json({ data: newMovie });
});

//PUT - Atualizar

app.put("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = movies.findIndex((findMovie) => findMovie.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Filme não encontrado"});
    }

    const { title, year} = req.body;

    if (!title || !year) {
        return res.status(400).json({ message: "Campos 'title' e 'year' são obrigatórios"});
    }

    movies[index] = { id, title, year };
    res.status(200).json({ data: movies[index] });
})

//DELETE - Apagar

app.delete("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = movies.findIndex((findMovie) => findMovie.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Filme não encontrado" });
    }

    movies.splice(index, 1);
    res.status(200).json({ message: "Filme eliminado com sucesso" });
})




/*  ----------------------------------
    --LAB-2 -- API Gestão de Tarefas--
    ----------------------------------
*/

let tasks = [
    { id: 1, title: "Estudar Node.js", completed: false, priority: "high" },
    { id: 2, title: "Fazer LAB-1", completed: true, priority: "medium" }
];

//GET - Lista todas (+ filtra por estado)

app.get("/tasks", (req, res) => {
    const { completed } = req.query;

    if (completed === undefined) {
        return res.status(200).json({ data: tasks });
    }

    if (completed !== "true" && completed !== "false") {
        return res.status(400).json({ message: "O parâmetro do query só pode ser 'true' ou 'false'"});
    }

    const filteredTasks = tasks.filter((findTask) => findTask.completed === (completed === "true"));

    res.status(200).json({ data: filteredTasks });
});

//GET stats

app.get("/tasks/stats", (req,res) => {
    const stats = {
        numTasks: 0,
        completedTasks: 0,
        incompleteTasks: 0
    };

    for(let i = 0; i < tasks.length; i++){
        stats.numTasks++;

        if(tasks[i].completed === true){
            stats.completedTasks++;
        } else {
            stats.incompleteTasks++;
        }
    }

    res.status(200).json({ data: stats });
});

//GET - mostra um

app.get("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find((findTask) => findTask.id === id);

    if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada"});
    }

    res.status(200).json({ data: task});
});

//POST - cria tarefa

app.post("/tasks", (req, res) => {
    const { title, priority } = req.body;

    if(!title || !priority) {
        return res.status(400).json({ message: "Os campos 'title' e 'priority' são obrigatórios"});
    }

    if(priority !== "low" && priority !== "medium" && priority !== "high") {
        return res.status(400).json({ message: "O campo 'priority' só pode receber 'low', 'medium' ou 'high'"});
    }

    const newTask = {
        id: tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1,
        title,
        completed: false,
        priority
    };
    tasks.push(newTask);

    res.status(201).json({ data: newTask });
});

//PUT - atualiza

app.put("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex((findTask) => findTask.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const { title, priority } = req.body;

    if(!title || !priority) {
        return res.status(400).json({ message: "Os campos 'title' e 'priority' são obrigatórios"});
    }

    if(priority !== undefined &&priority !== "low" && priority !== "medium" && priority !== "high"){
        return res.status(400).json({ message: "O campo 'priority' só pode receber 'low', 'medium' ou 'high'" });
    }

    tasks[index] = {
        id,
        title,
        completed: tasks[index].completed,
        priority
    };

    res.status(200).json({ data: tasks[index] });
});

//PATCH - alterna estado

app.patch("/tasks/:id/toggle", (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex((findTask) => findTask.id === id);

    if(index === -1) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    tasks[index].completed = !tasks[index].completed;

    res.status(200).json({ data: tasks[index] });
});

//DELETE - apaga

app.delete("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex((findTask) => findTask.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    tasks.splice(index, 1);

    res.status(200).json({ message: "Tarefa eliminada com sucesso" });
});










/*  ----------------------------------
    --LAB-3 -- API Gestão de Tarefas com Prisma--
    ----------------------------------
*/

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

//GET - listar todas

app.get("/prisma/tasks", authenticateToken, async (req, res) => {
    const { completed } = req.query;

    if(completed === undefined) {
        const tasks = await prisma.task.findMany();
        return res.status(200).json(tasks);
    }

    if(completed !== "true" && completed !== "false") {
        return res.status(400).json({ message: "O campo 'completed' só pode receber 'true' ou 'false'"});
    }

    const filteredTasks = await prisma.task.findMany({
        where: { completed: completed === "true" },
    });

    res.status(200).json(filteredTasks);
});

//GET stats

app.get("/prisma/tasks/stats", authenticateToken, async (req, res) => {
    const stats = {
        quantity: 0,
        completed: 0,
        incomplete: 0
    };

    stats.quantity = await prisma.task.count();
    stats.completed = await prisma.task.count( {
        where: { completed: true },
    });
    stats.incomplete = await prisma.task.count( {
        where: { completed: false },
    });

    res.status(200).json({ stats: stats });
});

//GET - listar uma

app.get("/prisma/tasks/:id", authenticateToken, async (req, res) => {
    const task = await prisma.task.findUnique({
        where: { id: req.params.id },
    });

    if(!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    res.status(200).json(task);
});

//POST - criar

app.post("/prisma/tasks", authenticateToken, async (req, res) => {
    const { title, description, priority } = req.body;

    if(!title){
        return res.status(400).json({ message: "O campo 'title' é obrigatório" });
    }

    if(priority !== undefined && priority !== "low" && priority !== "medium" && priority !== "high") {
        return res.status(400).json({ message: "O campo 'priority' só pode receber 'low', 'medium' ou 'high'" });
    }

    const newTask = await prisma.task.create({ data: { title, description, priority },
    });

    res.status(201).json(newTask);
})

//PUT - atualizar

app.put("/prisma/tasks/:id", authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { title, description, completed, priority } = req.body;

    const task = await prisma.task.findUnique({
        where: { id: id },
    })

    if(!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    if(!title) {
        return res.status(400).json({ message: "O campo 'title' é obrigatório" });
    }

    if(priority !== undefined && priority !== "low" && priority !== "medium" && priority !== "high") {
        return res.status(400).json({ message: "O campo 'priority' só pode receber 'low', 'medium' ou 'high'" });
    }

    const updatedTask = await prisma.task.update({
        where: { id: id },
        data: { title, description, completed, priority },
    });

    res.status(200).json(updatedTask);
})

//PATCH - alternar
app.patch("/prisma/tasks/:id/toggle", authenticateToken, async (req, res) => {
    const id = req.params.id;
    const task = await prisma.task.findUnique({
        where: {id: id },
    });

    if(!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const updatedTask = await prisma.task.update({
        where: { id: id },
        data: {completed: !task.completed },
    })

    return res.status(200).json(updatedTask);
})

//DELETE - apagar

app.delete("/prisma/tasks/:id", authenticateToken, async (req, res) => {
    const id = req.params.id;
    const task = await prisma.task.findUnique({
        where: {id: id},
    });

    if(!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    await prisma.task.delete({
        where: { id: id },
    });

    res.status(204).send();
})

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