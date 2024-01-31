import React, {useEffect, useState} from 'react';
import '../css/styles.css';

const RentedBooks = () => {
    const [rentedBooks, setRentedBooks] = useState([])
    const error = false; // Set to true if there's an error
    const errorMSG = "Your error message"; // Set your error message

    const [flag, setFlag] = useState(true)

    const returnBook = async (bookId) => {
        await fetch(`http://localhost:8000/returnBook`, {
            method: 'POST',
            credentials: 'include', // Include credentials for session
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: bookId}),
        }).then(setFlag(!flag));
    };

    const fetchBooks = async () => {
        try {
            const response = await fetch('http://localhost:8000/rentedBooks', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include credentials for session
            });
            if (response.ok) {
                const data = await response.json();
                setRentedBooks(data.rentedBooks);
            } else {
                console.error('An error occurred while fetching the books:', response.statusText);
            }
        } catch (error) {
            console.error('An error occurred while fetching the books:', error.message);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, [flag]);

    return (
        <div>
            <div className="mainPanel">
                {error ? (
                    <h2>{errorMSG}</h2>
                ) : (
                    <div className="errorPanel"></div>
                )}
                <div className="bookPanel">
                    <h1>Wypożyczone przez ciebie książki</h1>
                    {rentedBooks.map((rbook) => (
                        <div key={`book${rbook.book.id}`} className="bookContainer">
                            <img className="book" src={rbook.book.url} alt={rbook.book.title} />
                            <div className="infoPanel">
                                <p>Tytuł: {rbook.book.title}</p>
                                <p>Autor: {rbook.book.author}</p>
                                <p className="copies">Liczba wypożyczonych egzemplarzy: {rbook.no_copies}</p>
                                <button type="button" onClick={() => returnBook(rbook.book.id)}>
                                    Oddaj
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="stopka">
                <p>Biblioteka Główna Akademii Górniczo-Hutniczej im. Stanisława Staszica w Krakowie</p>
                <p>tel. +48 12 617 32 08</p>
                <p>e-mail: bgagh@bg.agh.edu.pl</p>
            </div>
        </div>
    );
};


export default RentedBooks;