import { useInView } from '../../hooks/useInView'

/**
 * Aparece al entrar en viewport (scroll reveal).
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  style,
  ...rest
}) {
  const [ref, inView] = useInView({ once: true })

  return (
    <Tag
      ref={ref}
      className={`landing-reveal${inView ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
