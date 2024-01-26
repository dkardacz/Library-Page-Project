import React, { useState } from 'react';
import Book from "./Book.js";
import Basket from "./Basket.js";

const BooksList = () => {
    const [books, setBooks] = useState([]); // Initialize books state
    const [basketBooks, setBasketBooks] = useState([]); // Initialize basket state

    const addBookToBasket = (bookId) => {
        // Add the selected book to the basket
        const selectedBook = books.find(book => book.id === bookId);
        setBasketBooks(prevBasket => [...prevBasket, selectedBook]);
    };

    return (
        <div>
            <div className="mainPanel">
                <div className="errorPanel"></div>
                <h1>Akademia Górniczo Hutnicza</h1>
                <div className="bookPanel">
                    {books.map(book => (
                        <Book key={book.id} book={book} addBookToBasket={addBookToBasket} />
                    ))}
                    <Basket basketBooks={basketBooks} />
                </div>
            </div>
            <div className="stopka">
                <p>Kontakt</p>
                <p>Telefon: 123 456 789</p>
                <p>Adres mailowy: biblio@agh.edu.pl</p>
            </div>
        </div>
    );
};

export default BooksList;