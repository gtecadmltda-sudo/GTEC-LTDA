/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TutorialTour, TutorialTourProps } from './TutorialTour';

export type OnboardingTourProps = TutorialTourProps;

// Re-export TutorialTour as OnboardingTour for complete backward compatibility
export const OnboardingTour = React.memo(function OnboardingTour(props: OnboardingTourProps) {
  return <TutorialTour {...props} />;
});

export default OnboardingTour;
