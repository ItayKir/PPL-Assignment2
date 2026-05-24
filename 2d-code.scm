;1. Convert the ClassExps to ProcExps
; Before Conversion
(define pi 3.14)
(define square (lambda (x) (* x x)))
(define circle
	(class (x y radius)
		(
		 (area (lambda () (* (square radius) pi)))
		 (perimeter (lambda () (* 2 pi radius)))
		)
	)
)
(define c (circle 0 0 3))
(c 'area)


;After Conversion
(define pi 3.14)
(define square (lambda (x) (* x x)))
(define circle
	(lambda (x y radius)
		(lambda(msg)
			(if (eq? msg 'area)
				(lambda () (* (square radius) pi))
				(if (eq? msg 'perimeter)
					(lambda () (* 2 pi radius))
					'error
				)
			)
		)
	)
)
(define c (circle 0 0 3))
(c 'area)


;2. List the expressions which are passed to the L3applicativeEval function during the
;   computation of the program, (after the conversion), for the case of substitution model.

;1
3.14

;2
(lambda (x) (* x x))


;3
(lambda (x y radius)
	(lambda(msg)
		(if (eq? msg 'area)
			(lambda () (* (square radius) pi))
			(if (eq? msg 'perimeter)
				(lambda () (* 2 pi radius))
				'error
			)
		)
	)
)


;4
(circle 0 0 3)

;5
circle

;6
0

;7
0

;8
3

;9
(lambda(msg)
	(if (eq? msg 'area)
		(lambda () (* (square 3) pi))
		(if (eq? msg 'perimeter)
			(lambda () (* 2 pi 3))
			'error
		)
	)
)

;10
(c 'area)

;11
c

; 12
'area

;13
(if (eq? 'area 'area)
	(lambda () (* (square 3) pi))
	(if (eq? 'area 'perimeter)
		(lambda () (* 2 pi 3))
		'error
	)
)

;14
(eq? 'area 'area)

;15
eq?

;16
'area

;17
'area

;18
(lambda () (* (square 3) pi))


