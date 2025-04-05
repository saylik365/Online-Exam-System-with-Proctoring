'use client';

import Link from "next/link"
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { fadeIn, slideIn } from '@/config/animations';

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  backdrop-filter: blur(8px);
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  height: 3.5rem;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Logo = styled(Link)`
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

const NavLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  text-decoration: none;
  transition: ${({ theme }) => theme.animations.transition};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Hero = styled(motion.section)`
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  text-align: center;
`;

const Title = styled(motion.h1)`
  font-size: clamp(2rem, 5vw, 4.5rem);
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 42rem;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
`;

const PrimaryButton = styled(Link)`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-decoration: none;
  transition: ${({ theme }) => theme.animations.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

const SecondaryButton = styled(Link)`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-decoration: none;
  transition: ${({ theme }) => theme.animations.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundAlt};
  }
`;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        <Container>
          <Nav>
            <Logo href="/">ExamFlow</Logo>
            <div style={{ flex: 1 }} />
            <NavLink href="/login">Login</NavLink>
            <NavLink href="/register">Register</NavLink>
          </Nav>
        </Container>
      </Header>
      <main className="flex-1">
        <Container>
          <Hero initial="hidden" animate="visible" variants={fadeIn}>
            <Title variants={slideIn}>
              Welcome to ExamFlow
            </Title>
            <Subtitle variants={slideIn}>
              A modern platform for conducting online examinations with AI-powered proctoring.
            </Subtitle>
            <ButtonGroup>
              <PrimaryButton href="/register">Get Started</PrimaryButton>
              <SecondaryButton href="/about">Learn More</SecondaryButton>
            </ButtonGroup>
          </Hero>
        </Container>
        <section
          id="features"
          className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
        >
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Our platform offers a comprehensive solution for online examinations
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:gap-8">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <h3 className="font-bold">AI Proctoring</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI-powered monitoring to ensure exam integrity
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <h3 className="font-bold">Real-time Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analytics and reporting for exam performance
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <h3 className="font-bold">Secure Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security with end-to-end encryption
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by{" "}
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Your Team
              </a>
              . The source code is available on{" "}
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 