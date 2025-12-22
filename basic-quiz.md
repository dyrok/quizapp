1. what will be printed?

x = "Hello"
print(x*2)

- Error
- Hello
- HelloHello
- Hello*2

2. Which Operator has the highest precedence?

- +
- ==
- not
- **

6. How many times will this loop run?

for i in range(1,6):
    pass

- 4 
- 5 
- 6
- infinite

7. What is the Output

i = 5
while i > 5:
    print(i)
    i-= 1

- No output
- 5
- 5 4 3 2 1
- Error

8. What does the return statement do?

- Stops the interpreter 
- exits the loop
- sends a value back from a function
- converts data types

9. which built in function finds the smallest value?

- less()
- minimum()
- small()
- min()

10. What is the correct way to import only one function from a module?

- include function from module 
- import module > function
- from module import function 
- load module.function

11. what is the output of this try except block?

try:
    print(10/5)
except:
    print("Error")

- Error
- 2.0
- 0
- None

12. which data structiure doesnt allow duplicates?

- list
- tuple
- set
- dictionary

13. which statement is correct about tuples? 

- they are mutable
- they are immutable
- they support append() 
- they behave like sets

14. what will this prin?

class Test:
    x=5
obj = Test()
print(obj.x)

- Error
- 5
- None
- 0

15. Which concept allows multiple calsses to have methods with the same name but different behaviour?

- Abstraction
- Polymorphism
- Inheritance
- Overriding

16. Which of these creates an anonymous function?

- lambda
- define
- anon
- func

17. What is NumPy primarily used for?

- Machine learning algorithms
- Numerical computations and arrays
- web development
- file handling

18. What pandas function reads csv files?

- pd.open_csv()
- pd.load_csv()
- pd.read_csv()
- pd.csv_read()

19. Which Matplotlib function is used to create a bar chart?

- plt.bar()
- plt.show()
- plt.plot()
- plt.line()

20. What is a common first step in Data cleaning?

- adding random values 
- dropping duplicate rows
- increasing dataset size 
- Encrypting the Data.

---

1. Which of the following is not a feature of python

- Interpreted
- Easy to Learn
- Low Level memory management
- Object oriented

2. What will be the output of this code?

x = 10 
y = 3
print(x//5)

- 3.33
- 3
- 4 
- 0

3. which of the following is a valid variable name in python

- 1value
- value_1
- value-1
- value 1

4. what is the data type returned by input()?

- int
- float
- string
- boolean

5. what will this code print

a = True 
b = False
print(a and not b)

- True
- False
- Error
- None

6. which loop will be the best suited when the number of iterations is known?

- do while loop
- while loop
- for loop
- switch loo

7. what is the output of this code? 

for i in range(2,10,3):
    print(i, end=" ")

- 2 3 4 
- 2 5 8 
- 3 5 9 
- 2 4 6 

8. what does the function do?

def calc(a, b=2):
    return a * b

print(calc(3))

- 3
- 5
- 6
- 9

9. which built in function gives largest element of the list.

- big()
- max()
- top()
- high()


10. which is the correct way to import only sqrt function from math module?

- import math.sqrt
- from math import sqrt
- include math.sqrt
- using math.sqrt

11. what is the output of this code?

try:
    print(10/0)
except:
    print("Error")

- Error
- Zero
- 0
- No Output

12. which data structure is unordered and contains unique elements?

- list
- tuple
- set
- dictionary

13. what is the output of this code?

my_tuple = (10,20,30)
print(len(my_tuple))

- 1
- 2
- 3
- 30

14. which oop concept allows creating a subclass from an existing class?

- Abstraction
- Polymorphism
- Inheritance
- Encapsulation

15. What will this code output?

Class A:
    def show(self):
        return "A"

class B:
    pass

obj = B()
print(obj.show())

- Error
- A
- None
- B

16. what is the purpose of lambda function?

- create long functions
- create anonymous functions
- Replace all functions
- loop through lists

17. what is the output of this code?

import numpy as np
arr = np.array([[1,2],[3,4]])
print(arr.shape)

- (1,4)
- (4,1)
- (2,2)
- (2,4)

18. in pandas which datastructure is used to store data in tabular form?

- Series
- DataFrame
- Array
- Matrix

19. what does the following matplotlib code does?
 
plt.plot([1,2,3],[4,5,6])

- draws a bar graph
- draws a line graph
- draws a scatter plot
- draws a piechart

20. which of the following is the part of the basic data cleaning?

- encrypting data
- dropping missing values
- Adding random values
- Increasing dataset size

---

1. which command is used to check the installed python version

- python --check
- python -v 
- python --version
- python show-version

2. What will be printed by this code 

s = "Python"
print(s[1:4])

- yth
- ytho
- Pyth
- Pyt

3. What is the output type of 3.14 + 2 in Python?

- int
- float 
- str
- bool

4. What operator is used for exponentiation in python?

- **
- ^
- %
- //

5. What is the result of thos logical expression?

not (False or True) and True

- True
- False
- Error
- None

6. which statement defines an empty set correctly?

- s = {}
- s = []
- s = set()
- s = ()

7. What will be the output of this code snippet?

a = [1,2,3]
b = a 

b.append(4)

print(a)

- [1,2,3]
- [1,2,3,4]
- [4]
- Error

8. Choose the correct way for opening a file for reading and writing (overwriting) in python.

- open("file.txt", "r+")
- open("file.txt", "rw")
- open("file.txt", "w+")
- open("file.txt", "a+")

9. what will this print?

def f(x, y = 5, *args):
    return x + y + sum(args)

print(f(2,3,4,5))

- 9
- 14 
- 7 
- 10 

10. which of these is not a valid method to import a module or its part?

- import math
- from math import sqrt
- from math as m
- include math

11. what does this numpy code output

import numpy as np
a = arange(0,9).reshape(3,3)
print(a[1,:])

- [0 1 2]
- [3 4 5]
- [6 7 8]
- [1 2 3]

12. in pandas which method returns summary statistics like (mean, std, min, max) of numerical columns in DataFrame?

- df.info()
- df.describe()
- df.summary()
- df.stats()

13. which built-in python function converts a string '123' into integer 123?

- parse_int()
- int()
- integer()
- to_int()

14. what is printed by this code?

x = None

if x:
    print("yes")
else:
    print("no")

- yes
- no
- Error
- None

15. what keywords are used to define a generator function?

- gen
- lambda
- yield
- generate

16. For OOP, what does the term 'encapsulation' refer to?

- Hiding required states and requiring methods for accessing data
- allowing multiple inheritence
- overriding base class methods
- Creating multiple objects

17. which of these will correctly create a dictionary with keys "a" , "b" and values 1,2?

- {"a":1, "b":2}
- {a:1, b:2}
- dict(a=1, b=2)
- dict("a":1, "b":2)


18. what will be printed by this code snippet?

import random
print(random.randint(1,5))

- a random float between 1 to 5
- a random integer between 1 to 4
- a random integer between 1 to 5 (inclusive)
- always 1


19. which of the following is correct to create a line plot using matplotlib? assuming import matplotlib.pyplot as plt

- plt.line([1,2,3],[4,5,6])
- plt.plot([1,2,3],[4,5,6])
- plt.bar([1,2,3],[4,5,6])
- plt.scatter([1,2,3],[4,5,6])







