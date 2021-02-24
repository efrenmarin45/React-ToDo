import './App.css';
import { useQuery, gql, useMutation } from '@apollo/client';
import React, {useState} from 'react';

const GET_TODOS = gql`
  query getTodos{
    todos{
      id
      text
      done
    }
  }
`

const TOGGLE_TODO = gql`
  mutation toggleTodo($id: uuid!, $done: Boolean!) {
    update_todos(where: {id: {_eq: $id}}, _set: {done: $done}) {
      returning {
        done
        id
        text
      }
    }
  }
`

const ADD_TODO = gql`
  mutation addTodo($text: String!) {
    insert_todos(objects: {text: $text}) {
      returning {
        done
        id
        text
      }
    }
  }
`

const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos(where: {id: {_eq: $id}}) {
      returning {
        done
        id
        text
      }
    }
  }
`

function App() {
  const [todoText, setTodoText] = useState('');
  const {data, loading, error} = useQuery(GET_TODOS);
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [deleteTodo] = useMutation(DELETE_TODO);
  const [addTodo] = useMutation(ADD_TODO, {
    onCompleted: () => setTodoText('')
  });

  async function handleToggleTodo({id, done}){
    const toggleData = await toggleTodo({variables: {id, done: !done}});
    console.log(toggleData);
  }

  async function handleAddTodo(event){
    event.preventDefault();
    if(!todoText.trim())
      return;
    const addData = await addTodo({
      variables: {text: todoText},
      refetchQueries: [
        {query: GET_TODOS}
      ]
    });
    console.log(addData)
  }

  async function handleDeleteTodo({id}){
    const deleteData = await deleteTodo({
      variables: {id},
      update: cache => {
        const prevData = cache.readQuery({query: GET_TODOS})
        const newTodo = prevData.todos.filter(todo => todo.id !== id)
        cache.writeQuery({query: GET_TODOS, data: {todos: newTodo}});
      }
    });
    console.log(deleteData);
  }

  if (loading)
    return(
      <div>Loading...</div>
    )

  if (error)
    return(
        <h1>Error fetching Data</h1>
    )

    return(
      <div className="container">
        <h1 className="title">Things To Do</h1>
        <form onSubmit={handleAddTodo}>
          <input 
            type="text" 
            placeholder="Add a goal for today" 
            onChange={event => setTodoText(event.target.value)}
            value={todoText}
            />
          <button className="createBtn" type="submit">Create</button>
          
        </form>
        <div className="todos">
          {data.todos.map(todo => (
            <p onDoubleClick={() => handleToggleTodo(todo)} key={todo.id}>
              <span className={`todoText ${todo.done && 'strike'}`}>
                {todo.text}
              </span>
              <button className="delete" onClick={() => handleDeleteTodo(todo)}> &times;</button>
            </p>
          ))}
        </div>
    </div>
    )
}

export default App;