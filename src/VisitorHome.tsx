import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Bot, Compass, Camera, Heart, MapPin, Menu, Search, Shield, Users, X
@} from 'lucide-react';
import tpaLogo from './assets/png-tpa-logo.png';
import DestinationExplorer from './visitor/DestinationExplorer';
import AiConcierge from './visitor/AiConcierge';
import VisitorIndustryTripIntegration from './visitor/VisitorIndustryTripIntegration';
import TripPlanner from './visitor/TripPlanner';
import DestinationDetail from './visitor/DestinationDetail';

interface Props { onAdmin: () => void }
interface Destination { id: string; name: string; province: string; description: string }

  const heroImage = 'https://papuanewguinea.travel/wp-content/uploads/elementor/thumbs/What-To-Do-In-Milne-Bay-Province-rkffalz60frjn6vrj1z9zkwro2anrnpfia7ub30n4w.webp';
