// import './App.css'
// const App=()=>{
//   return (
// 	<div>
// 	  <h1 className='bg-amber-300 h-10 text-3xl'>Hello World</h1>
// 	</div>
//   )
// }
// export default App

import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex min-h-svh flex-row items-center justify-center gap-4">
      <Button>Default</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">⭐</Button>
    </div>
  )
}

export default App

