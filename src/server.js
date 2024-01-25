import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import db from './database.js';

import bcrypt from 'bcrypt';
import session from 'express-session';

/* *************************** */
/* Configuring the application */
/* *************************** */
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', __dirname + '/views'); // Files with views can be found in the 'views' directory
app.set('view engine', 'pug'); // Use the 'Pug' template system
app.locals.pretty = app.get('env') === 'development'; // The resulting HTML code will be indented in the development environment
app.use(express.urlencoded({ extended: false }));
/* ************************************************ */

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(session({ secret: "Your secret key" }));

const firstname = "Jan"
const lastname = "Kowalski"

/* ******** */
/* "Routes" */
/* ******** */

// app.get('/', async function (request, response, next) {
//     var docs = await db.all("SELECT * FROM books WHERE id < 5", []);
//     response.sendFile(path.join(__dirname, 'views', 'mainPage.html'));
// });

const user = "test";
const hashed_password = bcrypt.hashSync("test", 10); // Hash the password (adjust the saltRounds as needed)

app.get('/login', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async function (req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    if (username !== user || !bcrypt.compareSync(password, hashed_password)) {
        return res.status(401).json({ msg: 'Bad username or password' });
    }
    var newUser = { id: req.body.username, password: req.body.password };
    req.session.user = newUser;
    // Passwords match, login is successful
    // You can create a session or JWT token here if needed
    res.json({ token: 'your_access_token' });
});

function checkSignIn(req, res, next) {
    if (req.session.user) {
        next();  // Якщо сесія існує, перейти до сторінки
    } else {
        var err = new Error("Not logged in!");
        console.log(req.session.user);
        next(err);  // Помилка, спроба доступу до несанкціонованої сторінки!
    }
}

app.get('/', async function (request, response, next) {
    var docs = await db.all("SELECT * FROM books WHERE id < 5", []);
    response.render('mainPage', { 'mainBooks': docs }); // Render the 'index' view
});

app.get('/books', async function (request, response, next) {
    var books = await db.all("SELECT * FROM books", []);
    response.render('booksList', { 'books': books });
});

app.post('/updateBookContainer', async function (request, response, next) {
    var book = await db.get("SELECT * FROM books WHERE id = ?", [request.body.id]);
    response.send({ "book": book });
});

app.post('/rentBooks', checkSignIn, async function (request, response, next) {

    var rentedBooks = request.body.rentedBooks;
    var error = false;
    var errorMSG = '';

    var student = await db.get("SELECT * FROM students WHERE firstname = ? AND lastname = ?", [firstname, lastname]);
    if (student) {
        for (const rbook of rentedBooks) {
            var book = rbook.book;
            for (var i = 0; i < rbook.no_copies; i++) {
                await db.run("INSERT INTO rentals (book_id, student_id) VALUES (?, ?)", [book.id, student.id]);
            }
            await db.run("UPDATE books SET no_copies = ? WHERE id = ?", [book.no_copies - rbook.no_copies, book.id]);
        }
    }
    response.send({ "rentedBooks": rentedBooks, "error": error, "errorMSG": errorMSG });

});

app.post('/addBookToBasket', async function (request, response, next) {

    const id = parseInt(request.body.id);

    var error = false;
    var errorMSG = '';
    var book = null;

    var student = await db.get("SELECT * FROM students WHERE firstname = ? AND lastname = ?", [firstname, lastname]);
    if (!student) {
        error = true;
        errorMSG = "Podany student nie znajduje się w naszej bazie";
    }
    else {
        var found = await db.get("SELECT * FROM books WHERE id = ?", [id]);
        book = found;
        if (!found) {
            error = true;
            errorMSG = "Podanej książki nie ma w naszej bazie";
        }
        else {
            if (found.no_copies <= 0) {
                error = true;
                errorMSG = "Brak dostępnych egzemplarzy do wypożyczenia";
            }
            else if (!error) {
                errorMSG = "Znaleziono: " + String(found.id);
            }
        }
    }
    var bookArgs = {
        'error': error,
        'errorMSG': errorMSG,
        'book': book,
    }
    response.json(bookArgs);
});

app.post('/deleteBookFromBasket', async function (request, response, next) {
    var bookID = request.body.id;
    var book = await db.get("SELECT * FROM books WHERE id = ?", [bookID]);
    response.send({ 'book': book });
});

app.get('/rentedBooks', async function (request, response, next) {

    var error = false;
    var errorMSG = '';
    var rentedBooks = []

    var student = await db.get("SELECT * FROM students WHERE firstname = ? AND lastname = ?", [firstname, lastname]);
    if (!student) {
        error = true;
        errorMSG = "Nie znaleziono użytkownika"
    }
    else {
        var rents = await db.all("SELECT * FROM rentals WHERE student_id = ?", [student.id]);
        for (let i = 0; i < rents.length; i++) {
            var rental = rents[i];
            var book = await db.get("SELECT * FROM books WHERE id = ?", [rental.book_id]);
            if (rentedBooks.length === 0) {
                var newPos = {
                    'book': book,
                    'no_copies': 1,
                };
                rentedBooks.push(newPos);
            } else {
                const foundBook = rentedBooks.find(obj => obj.book.id === book.id);
                if (foundBook) {
                    foundBook.no_copies += 1;
                } else {
                    var newPos = {
                        'book': book,
                        'no_copies': 1,
                    };
                    rentedBooks.push(newPos);
                }
            }
        }
    }
    response.render('rented', { "error": error, "errorMSG": errorMSG, "rentedBooks": rentedBooks });
});

app.post('/updateRentedList', async function (request, response, next) {
    var error = false;
    var errorMSG = '';
    var rentedBooks = [];

    var student = await db.get("SELECT * FROM students WHERE firstname = ? AND lastname = ?", [firstname, lastname]);
    if (!student) {
        error = true;
        errorMSG = "Nie znaleziono użytkownika"
    }
    else {
        var rents = await db.all("SELECT * FROM rentals WHERE student_id = ?", [student.id]);
        for (let i = 0; i < rents.length; i++) {
            var rental = rents[i];
            var book = await db.get("SELECT * FROM books WHERE id = ?", [rental.book_id]);
            if (rentedBooks.length === 0) {
                var newPos = {
                    'book': book,
                    'no_copies': 1,
                };
                rentedBooks.push(newPos);
            } else {
                const foundBook = rentedBooks.find(obj => obj.book.id === book.id);
                if (foundBook) {
                    foundBook.no_copies += 1;
                } else {
                    var newPos = {
                        'book': book,
                        'no_copies': 1,
                    };
                    rentedBooks.push(newPos);
                }
            }
        }
    }
    response.send({ "rentedBooks": rentedBooks, "error": error, "errorMSG": errorMSG })
});

app.post('/returnBook', async function (request, response, next) {
    var error = false;
    var errorMSG = '';

    var id = parseInt(request.body.id);
    var student = await db.get("SELECT * FROM students WHERE firstname = ? AND lastname = ?", [firstname, lastname]);
    if (!student) {
        error = true;
        errorMSG = "Podany student nie znajduje się w naszej bazie";
    }
    else {
        var book = await db.get("SELECT * FROM books WHERE id = ?", [id]);
        if (!book) {
            error = true;
            errorMSG = "Podanej książki nie ma w naszej bazie";
        }
        else {
            var rental = await db.get("SELECT * FROM rentals WHERE book_id = ? AND student_id = ?", [book.id, student.id]);
            console.log(rental)
            if (!rental) {
                error = true;
                errorMSG = "Podany student nie wypożyczał podanej książki";
            }
            if (!error) {
                await db.run("DELETE FROM rentals WHERE id = ? ", [rental.id]);
                await db.run("UPDATE books SET no_copies = ? WHERE id = ?", [book.no_copies + 1, book.id]);
            }
        }
    }
    response.send({ "error": error, "errorMSG": errorMSG, "id": id });
});

/* ************************************************ */

app.listen(8000, function () {
    console.log('The server was started on port 8000');
    console.log('To stop the server, press "CTRL + C"');
});          