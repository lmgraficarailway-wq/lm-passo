const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const SECRET_KEY = 'lm-passo-secret-key-change-me'; // Em produção usar .env

exports.login = (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });
        if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ error: 'Senha inválida' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, client_id: user.client_id || null }, SECRET_KEY, {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({ auth: true, token: token, user: { id: user.id, username: user.username, role: user.role, name: user.name, client_id: user.client_id || null } });
    });
};

// Apenas para criar o primeiro usuário ou usuários via API (protegido depois)
exports.register = (req, res) => {
    const { username, password, role, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
        [username, hashedPassword, role, name],
        function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao criar usuário.' });
            res.status(200).json({ message: 'Usuário criado com sucesso!', id: this.lastID });
        }
    );
};

exports.getAllUsers = (req, res) => {
    db.all("SELECT id, username, name, role FROM users ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
};

exports.changePassword = (req, res) => {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 4) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 4 caracteres' });
    }
    const hashedPassword = bcrypt.hashSync(new_password, 8);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: 'Senha alterada com sucesso' });
    });
};

exports.updateRole = (req, res) => {
    const { role } = req.body;
    const validRoles = ['master', 'financeiro', 'producao', 'vendedor', 'interno', 'cliente'];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Perfil inválido' });
    }
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: 'Perfil atualizado com sucesso' });
    });
};

exports.deleteUser = (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: 'Usuário excluído com sucesso' });
    });
};
