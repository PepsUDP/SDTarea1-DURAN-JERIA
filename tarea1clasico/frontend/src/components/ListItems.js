import React, { Fragment, useState, useEffect } from "react";

const InputItems = () => {

    const [item, setItem] = useState("");
    const [items, setItems] = useState([]);

    const onSubmitForm = async(e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3030/query/" +  item.toLowerCase(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const jsonData = await response.json();
            // console.log(jsonData);
            setItems(jsonData);
            // window.location = "/";
        } catch (error) {
            console.log(error);
        }
    };

    // const getItems = async() => {
    //     try {
    //         const response = await fetch("http://localhost:3030/api/items");
    //         const jsonData = await response.json();
    //         // console.log(jsonData);
    //         setItems(jsonData);
    //     } catch (error) {
    //         console.log(error);
    //     }
    // };

    // useEffect(() => {
    //     getItems();
    // }, []);

    const getTweets = async() => {
        try {
            const response = await fetch("http://localhost:3030/api/tweets");
            const jsonData = await response.json();
            console.log(jsonData);
            setItems(jsonData);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getTweets();
    }, []);

    return (
        <Fragment>
            <form className="d-flex mt-5" onSubmit={onSubmitForm}>
                <input type="text" className="form-control" placeholder="Palabra" value={item} onChange={e => setItem(e.target.value)}/>
                <button className="btn btn-success">Buscar</button>
            </form>
            <table className="table">
                <thead>
                <tr>
                    <th>target_sentiment</th>
                    <th>id</th>
                    <th>username</th>
                    <th>content</th>
                </tr>
                </thead>
                <tbody>
                {items && items.map(item => (
                    <tr key={(item.target_sentiment, item.id)}>
                        <td>{item.target_sentiment}</td>
                        <td>{item.id}</td>
                        <td>{item.username}</td>
                        <td>{item.content}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Fragment>
    
    )
}

export default InputItems;